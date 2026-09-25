// =====================================================================
// تكوين عنوان خادم الذكاء الاصطناعي للنسخة الأصلية (Capacitor)
// =====================================================================
// داخل المتصفح يعمل المسار النسبي (/api/...) بشكل طبيعي.
// داخل تطبيق الموبايل الأصلي يجب أن تشير الطلبات إلى السيرفر المنشور.
//
// طرق تحديد العنوان:
//   1. متغير البيئة VITE_API_URL أثناء البناء.
//   2. متغير VITE_APP_URL من ملف .env (نفس قيمة APP_URL).
//   3. الحقول أدناه (عدّلهما يدوياً).
// =====================================================================

const DEPLOYED_API_URL = '';

function resolveApiBase(): string {
  const fromVite1 = import.meta.env.VITE_API_URL as string | undefined;
  const fromVite2 = import.meta.env.VITE_APP_URL as string | undefined;
  const candidate = fromVite1 || fromVite2 || DEPLOYED_API_URL;
  if (candidate) {
    return candidate.replace(/\/+$/, '');
  }
  return '';
}

const apiBase = resolveApiBase();

/** هل تم تكوين خادم سحابي (بديل رئيسي)؟ إن لم يكن، يعمل التطبيق بالتوليد المباشر */
export function isServerConfigured(): boolean {
  return apiBase.length > 0;
}

export function apiUrl(path: string): string {
  if (apiBase) {
    return `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;
  }
  return path;
}

export { apiBase };