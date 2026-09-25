import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import mammoth from 'mammoth';
import { createServer as createViteServer } from 'vite';
import {
  CANDIDATE_MODELS,
  SYSTEM_INSTRUCTION,
  RESPONSE_SCHEMA,
  buildRequestParts,
  finalizeSermon,
  formatArabicErrorMessage,
  parseGeneratedJson,
} from './src/lib/khutbahEngine';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Increase payload limit for document and PDF uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ---------------- Gemini Client & Resilient Helpers ----------------
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required in environment variables');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function generateContentWithRetryAndFallback(
  ai: GoogleGenAI,
  params: { contents: any; config: any }
): Promise<string> {
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini] Attempting generation with model: ${model} (attempt ${attempt})`);
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });

        const textOutput = response.text?.trim();
        if (textOutput) {
          console.log(`[Gemini] Successfully generated content with model: ${model}`);
          return textOutput;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        console.warn(`[Gemini] Model ${model} attempt ${attempt} failed:`, errMsg);

        const isTransient =
          errMsg.includes('503') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('high demand') ||
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('fetch failed') ||
          errMsg.includes('ECONNRESET') ||
          errMsg.includes('ETIMEDOUT');

        if (isTransient && attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error('فشلت جميع محاولات توليد الخطبة بالذكاء الاصطناعي');
}

// ---------------- API Routes ----------------

// تطبيقاتنا: API عام (للقراءة فقط) يسلّم قائمة التطبيقات المضافة بصيغة JSON نظيفة
// مصدر البيانات: Firestore (قواعد القراءة تسمح للجميع) عبر REST API العام
const FIRESTORE_PROJECT = 'gen-lang-client-0686392114';
const FIRESTORE_DB = 'ai-studio-khutbahcraft-519fc26c-c7b7-46e1-950b-9ad5d5b26399';
const FIRESTORE_API = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT}/databases/${FIRESTORE_DB}/documents:runQuery`;

function firestoreValueToJs(value: any): any {
  if (value == null) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return parseInt(value.integerValue, 10);
  if ('doubleValue' in value) return parseFloat(value.doubleValue);
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) {
    return (value.arrayValue.values || []).map(firestoreValueToJs);
  }
  if ('mapValue' in value) {
    return firestoreFieldsToObject(value.mapValue.fields || {});
  }
  return null;
}

function firestoreFieldsToObject(fields: any): any {
  const out: any = {};
  for (const [key, value] of Object.entries(fields || {})) {
    out[key] = firestoreValueToJs(value);
  }
  return out;
}

app.get('/api/apps', async (req, res) => {
  // مفتوح لكل التطبيقات والمواقع (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=60');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  try {
    const queryPayload = {
      structuredQuery: {
        from: [{ collectionId: 'apps' }],
        orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'ASCENDING' }],
      },
    };

    const response = await fetch(FIRESTORE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queryPayload),
    });

    if (!response.ok) {
      console.error('Apps API: Firestore request failed:', response.status, await response.text());
      res.status(502).json({ success: false, error: 'تعذر جلب التطبيقات من قاعدة البيانات.' });
      return;
    }

    const documents: any[] = await response.json();

    const apps = documents
      .filter((entry) => entry.document)
      .map((entry) => {
        const doc = entry.document;
        const id = String(doc.name).split('/').pop() || '';
        const data = firestoreFieldsToObject(doc.fields || {});
        return { id, ...data };
      });

    res.json({
      success: true,
      count: apps.length,
      generatedAt: new Date().toISOString(),
      apps,
    });
  } catch (error: any) {
    console.error('Apps API error:', error);
    res.status(500).json({ success: false, error: error?.message || 'خطأ في جلب التطبيقات.' });
  }
});

// Parse docx on backend if needed
app.post('/api/parse-docx', async (req, res) => {
  try {
    const { base64Data } = req.body;
    if (!base64Data) {
      res.status(400).json({ error: 'لم يتم إرسال ملف' });
      return;
    }
    const buffer = Buffer.from(base64Data, 'base64');
    const result = await mammoth.extractRawText({ buffer });
    res.json({ success: true, text: result.value });
  } catch (error: any) {
    console.error('Docx parse error:', error);
    res.status(500).json({ error: error?.message || 'فشل في قراءة ملف Word' });
  }
});

// Generate Khutbah or Series
app.post('/api/generate-khutbah', async (req, res) => {
  try {
    const ai = getGeminiClient();

    const { parts } = buildRequestParts(req.body as any);

    // Generate Khutbah with automatic retry on transient errors and seamless model fallback
    const textOutput = await generateContentWithRetryAndFallback(ai, {
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const generatedData = parseGeneratedJson(textOutput);

    const finalizedSermon = finalizeSermon(generatedData, req.body as any);

    res.json({ success: true, sermon: finalizedSermon });
  } catch (error: any) {
    console.error('Generation error:', error);
    const friendlyError = formatArabicErrorMessage(error);
    res.status(500).json({
      error: friendlyError,
    });
  }
});

// Start server with Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
