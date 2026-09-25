import { registerPlugin, Capacitor } from '@capacitor/core';

/** الواجهة المشتركة لفتح تطبيق خارجي من داخل منبر الخطيب */
interface AppOpenPlugin {
  open(options: { packageName: string }): Promise<{ opened: boolean; source: 'native' | 'play' }>;
}

/**
 * يفتح التطبيق الخارجي بناءً على اسم الحزمة:
 * - التطبيق مثبّت على الجهاز → يُفتح مباشرة.
 * - غير مثبّت → يُوجَّه المستخدم إلى صفحة التطبيق على Google Play.
 * يعمل على الويب (المتصفح) بفتح صفحة Google Play في تبويب جديد.
 */
const AppOpen = registerPlugin<AppOpenPlugin>('AppOpen', {
  web: () => ({
    open: async () => ({ opened: false, source: 'play' as const }),
  }),
});

export const playStoreUrl = (packageName: string): string =>
  `https://play.google.com/store/apps/details?id=${encodeURIComponent(packageName)}`;

export async function openExternalApp(packageName: string): Promise<{ opened: boolean; source: 'native' | 'play' }> {
  try {
    const result = await AppOpen.open({ packageName });
    if (result && result.opened) return result;
    window.open(playStoreUrl(packageName), '_blank');
    return { opened: false, source: 'play' };
  } catch (err) {
    console.warn('Failed to open external app:', err);
    window.open(playStoreUrl(packageName), '_blank');
    return { opened: false, source: 'play' };
  }
}

/** للاستخدام داخل الصفحة: هل الفتح الفعلي يتم عبر الجهاز (native)؟ */
export function supportsNativeOpen(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}