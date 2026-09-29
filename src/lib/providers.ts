// =====================================================================
// سجل مزوّدات الذكاء الاصطناعي + محوّل التوليد المشترك
// (يُستخدم في التطبيق مباشرة وفي الخادم على حدٍّ سواء)
// =====================================================================
import { GoogleGenAI } from '@google/genai';
import { GenerateRequest } from '../types';
import { buildRequestParts, RESPONSE_SCHEMA, SYSTEM_INSTRUCTION } from './khutbahEngine';

export type ApiFormat = 'gemini' | 'openai' | 'anthropic';

export interface AiProvider {
  id: string;
  name: string;
  description: string;
  apiFormat: ApiFormat;
  baseUrl?: string;
  defaultModel: string;
  models: string[];
  requiresKey: boolean;
  signupUrl?: string;
}

export interface ProviderCallSettings {
  providerId: string;
  apiKey: string;
  model?: string;
}

/** المفتاح المدمج الافتراضي (يعمل بدون أي إعداد) */
export const DEFAULT_GEMINI_KEY = 'AIzaSyC7Gng-5SP6ayz8w51Gmz8M_OpAPI8NTeI';

/** المزوّدون المعروفون */
export const PROVIDERS: AiProvider[] = [
  {
    id: 'gemini',
    name: 'Gemini (Google)',
    description: 'ذكاء جوجل الاصطناعي — يعالج ملفات PDF مباشرة، وهو المزوّد المدمج الافتراضي.',
    apiFormat: 'gemini',
    defaultModel: 'gemini-3.8-flash',
    models: ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-3.1-flash-lite'],
    requiresKey: false,
    signupUrl: 'https://ai.google.dev/gemini-api/docs/api-key',
  },
  {
    id: 'openai',
    name: 'OpenAI (GPT)',
    description: 'نماذج GPT من أوبن إيه آي — مفتاح عبر platform.openai.com',
    apiFormat: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1', 'gpt-4.1-mini'],
    requiresKey: true,
    signupUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    description: 'نماذج Claude — بلاغة قوية ومعالجة معمّقة للنصوص.',
    apiFormat: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-haiku-4-5',
    models: ['claude-haiku-4-5', 'claude-sonnet-4-5', 'claude-opus-4-5'],
    requiresKey: true,
    signupUrl: 'https://console.anthropic.com/settings/keys',
  },
  {
    id: 'groq',
    name: 'Groq (Llama)',
    description: 'استدلال سريع جداً لنماذج Llama المفتوحة — مجاني مع حدود استخدام.',
    apiFormat: 'openai',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
    requiresKey: true,
    signupUrl: 'https://console.groq.com/keys',
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    description: 'نماذج Mistral الأوروبية — توازن ممتاز بين السرعة والجودة.',
    apiFormat: 'openai',
    baseUrl: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-large-latest',
    models: ['mistral-large-latest', 'mistral-medium-latest', 'open-mistral-nemo'],
    requiresKey: true,
    signupUrl: 'https://console.mistral.ai/api-keys/',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'نماذج صينية اقتصادية عالية الكفاءة بمفاتيح رخيصة.',
    apiFormat: 'openai',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    requiresKey: true,
    signupUrl: 'https://platform.deepseek.com/api_keys',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'بوابة موحّدة لمئات النماذج بمفتاح واحد (اختر حد الـ auto أو أي نموذج).',
    apiFormat: 'openai',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openrouter/auto',
    models: [
      'openrouter/auto',
      'google/gemini-2.5-flash',
      'meta-llama/llama-3.3-70b-instruct',
      'anthropic/claude-sonnet-4.5',
    ],
    requiresKey: true,
    signupUrl: 'https://openrouter.ai/keys',
  },
  {
    id: 'ollama',
    name: 'Ollama (محلي)',
    description: 'تشغيل محلي مجاني على جهازك عبر Ollama — دون حاجة لمفتاح.',
    apiFormat: 'openai',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2:latest',
    models: ['llama3.2:latest', 'llama3.1:8b', 'qwen2.5:7b'],
    requiresKey: false,
    signupUrl: 'https://ollama.com/download',
  },
];

/** الإعداد المدمج الافتراضي: Gemini بمفتاح مدمج */
export const BUILTIN_DEFAULT: ProviderCallSettings = {
  providerId: 'gemini',
  apiKey: DEFAULT_GEMINI_KEY,
  model: 'gemini-3.8-flash',
};

export function getProvider(providerId: string): AiProvider | undefined {
  return PROVIDERS.find((p) => p.id === providerId);
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
    msg.includes('NetworkError') ||
    msg.includes('timeout')
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function extractJsonText(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('```json')) return trimmed.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  if (trimmed.startsWith('```')) return trimmed.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return trimmed;
}

async function callGemini(
  apiKey: string,
  model: string,
  opts: { systemInstruction: string; contents: any; temperature: number }
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: opts.contents,
    config: {
      systemInstruction: opts.systemInstruction,
      temperature: opts.temperature,
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  });
  const output = response.text?.trim();
  if (!output) throw new Error('استجابة فارغة من المزوّد');
  return output;
}

async function callOpenAiCompat(
  provider: AiProvider,
  apiKey: string,
  model: string,
  opts: { systemInstruction: string; promptText: string; temperature: number }
): Promise<string> {
  const base = (provider.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: opts.systemInstruction },
        { role: 'user', content: opts.promptText },
      ],
      temperature: opts.temperature,
    }),
    signal: AbortSignal.timeout(150000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`استجابة خاطئة من المزوّد (${res.status}): ${String(body).slice(0, 400)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('استجابة فارغة من المزوّد');
  return content;
}

async function callAnthropic(
  provider: AiProvider,
  apiKey: string,
  model: string,
  opts: { systemInstruction: string; promptText: string; temperature: number }
): Promise<string> {
  const base = (provider.baseUrl || 'https://api.anthropic.com/v1').replace(/\/$/, '');
  const res = await fetch(`${base}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 32000,
      temperature: opts.temperature,
      system: opts.systemInstruction,
      messages: [{ role: 'user', content: opts.promptText }],
    }),
    signal: AbortSignal.timeout(150000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`استجابة خاطئة من المزوّد (${res.status}): ${String(body).slice(0, 400)}`);
  }
  const data = await res.json();
  const content = (data?.content || []).find((c: any) => c?.type === 'text')?.text as string | undefined;
  if (!content) throw new Error('استجابة فارغة من المزوّد');
  return content;
}

/**
 * توليد نص الخطبة (JSON خام) عبر المزوّد المحدد مع إعادة محاولة تلقائية
 * وتجربة نماذج المزوّد الأخرى عند فشل النموذج المختار.
 */
export async function generateKhutbahText(settings: ProviderCallSettings, request: GenerateRequest): Promise<string> {
  const provider = getProvider(settings.providerId);
  if (!provider) throw new Error('مزوّد الذكاء الاصطناعي غير معروف.');
  const apiKey = (settings.apiKey || '').trim();
  if (!apiKey && provider.requiresKey) throw new Error('لم يتم ضبط مفتاح API لهذا المزوّد.');

  const { promptText, parts } = buildRequestParts(request);
  const isPdf = Boolean(request.fileBase64 && request.fileMimeType === 'application/pdf');
  if (isPdf && provider.apiFormat !== 'gemini') {
    throw new Error('PDF_GUARD');
  }

  const contents = provider.apiFormat === 'gemini' ? { parts } : [promptText];

  const candidates = Array.from(
    new Set([(settings.model || '').trim() || provider.defaultModel, ...provider.models])
  ).filter(Boolean);

  let lastError: any = null;
  for (const model of candidates) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const opts = {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        };
        let raw: string;
        if (provider.apiFormat === 'gemini') {
          raw = await callGemini(apiKey, model, { ...opts, contents: contents as any });
        } else if (provider.apiFormat === 'anthropic') {
          raw = await callAnthropic(provider, apiKey, model, { ...opts, promptText });
        } else {
          raw = await callOpenAiCompat(provider, apiKey, model, { ...opts, promptText });
        }
        return extractJsonText(raw);
      } catch (err: any) {
        lastError = err;
        if (isTransientError(err) && attempt < 2) {
          await sleep(1500);
          continue;
        }
        break;
      }
    }
  }
  throw lastError || new Error('فشلت جميع محاولات توليد الخطبة بالذكاء الاصطناعي');
}