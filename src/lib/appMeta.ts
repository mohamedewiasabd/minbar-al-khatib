/**
 * بيانات الإصدار الظاهرة داخل التطبيق.
 * يتم تحديثها تلقائياً مع كل إصدار من الخطوة 0 في script/release-all.sh
 * (لا تعدّلها يدوياً — القيمة تُزامَن مع versionName في android/app/build.gradle).
 */
export const APP_VERSION = '1.16.0';

export const APP_NAME = 'منبر الخطيب الذكي';

export const DEVELOPER = {
  name: 'محمد عويس عبدالفتاح',
  initials: 'م ع',
  title: 'مطور تطبيقات • ELASTAD',
  phone: '+201027606755',
  email: 'admin@elastad.com',
} as const;
