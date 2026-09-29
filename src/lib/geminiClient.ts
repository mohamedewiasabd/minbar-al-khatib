// =====================================================================
// توليد مباشر في تطبيق الموبايل عبر المزوّد المفعّل (افتراضي بدون سيرفر)
// الدقة: إعداد المستخدم ← إعداد الإدارة ← المفتاح المدمج (Gemini).
// =====================================================================
import { GenerateRequest, Sermon } from '../types';
import { auth } from './firebase';
import { generateKhutbahText } from './providers';
import { resolveEffectiveProviderSettings } from './providerSettings';
import {
  finalizeSermon,
  formatArabicErrorMessage,
  parseGeneratedJson,
} from './khutbahEngine';

/**
 * توليد الخطبة مباشرة داخل التطبيق (دون الحاجة لسيرفر) ثم حفظها في Firestore
 */
export async function generateKhutbahDirect(request: GenerateRequest): Promise<Sermon> {
  try {
    const effective = await resolveEffectiveProviderSettings(auth.currentUser?.uid);
    try {
      const textOutput = await generateKhutbahText(
        { providerId: effective.providerId, apiKey: effective.apiKey, model: effective.model },
        request
      );
      const generatedData = parseGeneratedJson(textOutput);
      return finalizeSermon(generatedData, request);
    } catch (err: any) {
      if (err?.message === 'PDF_GUARD') {
        throw new Error(
          'لا يمكن معالجة ملفات PDF عبر هذا المزوّد؛ اختر مزوّد Gemini/Google لعرضه مباشرة أو ارفع المستند كنص.'
        );
      }
      throw err;
    }
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