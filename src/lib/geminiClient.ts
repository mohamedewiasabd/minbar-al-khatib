// =====================================================================
// توليد مباشر في تطبيق الموبايل عبر مفتاح Gemini (افتراضي بدون سيرفر)
// يستخدم VITE_API_URL إذا كان موجوداً (كبديل رئيسي)، وإلا فالمفتاح هنا.
// =====================================================================
import { GoogleGenAI } from '@google/genai';
import {
  CANDIDATE_MODELS,
  SYSTEM_INSTRUCTION,
  RESPONSE_SCHEMA,
  buildRequestParts,
  finalizeSermon,
  formatArabicErrorMessage,
  parseGeneratedJson,
} from './khutbahEngine';
import type { GenerateRequest, Sermon } from '../types';

const DEFAULT_GEMINI_KEY = 'AIzaSyC7Gng-5SP6ayz8w51Gmz8M_OpAPI8NTeI';

function resolveGeminiKey(): string {
  const fromVite = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  return (fromVite || DEFAULT_GEMINI_KEY).trim();
}

const apiKey = resolveGeminiKey();

function createClient(): GoogleGenAI {
  return new GoogleGenAI({ apiKey });
}

function isTransientError(err: any): boolean {
  const msg = err?.message || String(err);
  return (
    msg.includes('503') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('high demand') ||
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('fetch failed') ||
    msg.includes('ECONNRESET') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError')
  );
}

async function generateWithRetryAndFallback(ai: GoogleGenAI, contents: any): Promise<string> {
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7,
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
          },
        });
        const textOutput = response.text?.trim();
        if (textOutput) {
          return textOutput;
        }
      } catch (err: any) {
        lastError = err;
        if (isTransientError(err) && attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error('فشلت جميع محاولات توليد الخطبة بالذكاء الاصطناعي');
}

/**
 * توليد الخطبة مباشرة داخل التطبيق (دون الحاجة لسيرفر) ثم حفظها في Firestore
 */
export async function generateKhutbahDirect(request: GenerateRequest): Promise<Sermon> {
  try {
    const ai = createClient();
    const { parts } = buildRequestParts(request);
    const textOutput = await generateWithRetryAndFallback(ai, { parts });
    const generatedData = parseGeneratedJson(textOutput);
    return finalizeSermon(generatedData, request);
  } catch (err: any) {
    const friendlyError = formatArabicErrorMessage(err);
    throw new Error(friendlyError);
  }
}

/**
 * تحليل ملف Word (DOCX) محلياً داخل التطبيق في حال عدم وجود سيرفر
 */
export async function parseDocxLocally(base64Data: string): Promise<string> {
  try {
    const { default: mammoth } = await import('mammoth');
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const buffer = bytes.buffer;
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value || '';
  } catch (err: any) {
    console.warn('[Gemini] Error parsing docx locally:', err);
    throw new Error('فشل في قراءة ملف Word محلياً');
  }
}