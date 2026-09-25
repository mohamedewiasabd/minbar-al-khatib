# منبر الخطيب — مولد خُطب الجمعة الذكي

منصة ذكية لخطباء وأئمة الجمعة لصياغة خطب منبرية محكمة بالذكاء الاصطناعي مع حفظ سحابي كامل، ودعم اللهجات الإقليمية، وإصدار موبايل أندرويد أصلي (Capacitor) مع إعلانات AdMob.

---

## التشغيل المحلي (تطوير)

**المتطلبات:** Node.js 20+

```bash
npm install
```

ضع مفتاح Gemini في ملف `.env`:

```
GEMINI_API_KEY=AIzaSyC7Gng-5SP6ayz8w51Gmz8M_OpAPI8NTeI
```

ثم شغّل التطبيق:

```bash
npm run dev
```

يخدم Vite الواجهة على المنفذ 3000 (مع خادم التوليد Express).

## البناء والإصدار (ويب)

```bash
npm run build
npm start          # تشغيل خادم الإنتاج: node dist/server.cjs
```

## التوليد المباشر داخل التطبيق (بدون سيرفر)

التطبيق الأصلي يولد الخطب مباشرة عبر مفتاح Gemini المدمج (افتراضي):
- المفتاح في `.env` ضمن `VITE_GEMINI_API_KEY` (يُضمّن في حزمة الموبايل).
- إذا أضفت `VITE_API_URL` يفترض هذا المتغير بديلاً رئيسياً ويُستخدم الخادم السحابي المنشور (Cloud Run).
- عند حذف `VITE_API_URL` يعود التطبيق تلقائياً للتوليد المباشر بمفتاح Gemini، معتمداً على أحدث إصدار من النماذج تلقائياً.
- ملفات Word تُقرأ محلياً داخل التطبيق إن لم يوجد خادم.

## ملفات الإصدار النهائي (تم بناؤها)

| الملف | الغرض | الحجم |
| --- | --- | --- |
| `release/MinbarKhatib-v1.3.apk` | تثبيت مباشر (APK موقّع) | ~10.9 MB |
| `release/MinbarKhatib-v1.3.aab` | رفعه إلى Google Play (Android App Bundle) | ~10.6 MB |

نمط اسم التطبيق يتغيّر بحسب لغة الجهاز: العربية <= "منبر الخطيب"، الإنجليزية <= "Minbar Al-Khatib" (`res/values-en/strings.xml`).

التوقيع بمفتاح `keystore/minbar-khatib-release.keystore` (آلياً `minbar-khatib`)، ويُفضل استخدام Google Play App Signing بعد رفع مفتاح التحميل.

تسجيل الدخول: داخل التطبيق الأصلي يتم عبر **Google Sign-In أصلي** (`@capacitor-firebase/authentication` v8) ثم ربط الرمز بحساب Web Firebase؛ وعلى المتصفح يُستخدم النافذة المنبثقة. يعطّل النقر بواجهة نظام جوجل (وليس WebView منبثق) — لذا لن تظهر رسالة "The requested action is invalid" في النسخة الأصلية.

## الأيقونات والصور

- الملف الرئيسي للأيقونة: `assets/brand/icon-master.svg` (الهوية البصرية: تدرج أخضر + محراب + كتاب مفتوح + منبر + هلال ونجمة ذهبيين).
- شارة التطبيق المقصوصة (بدون الخلفية) للتكيفية: `assets/brand/icon-glyph.svg`.
- الأيقونات (mipmap بكل الكثافات)، شاشة السبلاش (بورتريه/لاندسكيب)، وفافيكو الويب المتعددة تُولَّد آلياً عبر `sharp` بأمر:

```bash
node scripts/generate-assets.mjs
```

بعد توليد الصور يعاد البناء بـ `npx cap sync android` ثم خطوات البناء أدناه.

## البناء للنسخة الأصلية (أندرويد APK)

المشروع مجهز بـ **Capacitor 8** و**@capacitor-community/admob 8**.

### 1. بناء الواجهة وتزامنها

```bash
npm run build
npx cap sync android
```

### 2. إضافة مشروع أندرويد (أول مرة فقط)

```bash
npx cap add android
```

### 3. إعداد رابط السيرفر السحابي

التطبيق الأصلي يستدعي `/api/generate-khutbah` و`/api/parse-docx` من خادم نشره. حدّد الرابط في **`capacitor.config.ts`** (أو متغير البناء `VITE_API_URL`):

```ts
server: {
  url: 'https://YOUR_CLOUD_RUN_URL.run.app',
  androidScheme: 'https',
},
```

ثم أعد:

```bash
npx cap sync android
```

### 4. فتح وإنشاء APK في Android Studio

```bash
npx cap open android
```

في Android Studio:
- انتظر اكتمال مزامنة Gradle
- اختر **Run ▶** لتثبيت التطبيق على جهاز/محاكي، أو
- **Build → Generate Signed App Bundle / APK** لإصدار APK موقع
- تُخرج الحزمة النهائية من مجلد `android/app/build/outputs/`

> **ملاحظة AdMob:** للتجربة ضع `initializeForTesting: true` في `capacitor.config.ts` (إعلانات تجريبية). عند الإصدار النهائي أعده `false`.

## هيكل منصات الإعلانات (AdMob)

الوحدات معرّفة في `src/lib/admob.ts`:

| الوحدة | النوع | الحالة |
| --- | --- | --- |
| بانر سفلي | `8528168842` | يظهر في تبويب لوحة الإحصائيات (dashboard) |
| مدمج مع المحتوى (مستطيل 300×250) | `8528168842` (وحدة البانر بالحجم المتوسط) | يُعرض داخل صفحة خُطب الجمعة بين الأقسام (`AdSlot`) |
| فتح التطبيق (App Open) | `5027907536` | يُعرض مرة واحدة عند إطلاق التطبيق |
| بمكافأة (Rewarded) | `7016579848` | يُعرض قبل فتح قراءة الخطبة وتنزيلها في التطبيق الأصلي |

> **تنبيه:** إعلان "Native Advanced" المطلوب وحدته `3545484644` يتطلب شيفرة أصلية (Java) إضافية ليست مغطاة بمكتبة `@capacitor-community/admob`. الوحدة محجوزة في `ADMOB_CONFIG` للتنفيذ مستقبلاً عند توسيع مشروع أندرويد.

## ملاحظات تقنية

- الحفظ والقراءة سحابيان بالكامل عبر Firestore (لا يوجد تخزين محلي).
- خادم Node مسؤول عن التوليد (Gemini) وقراءة ملفات Word فقط.
- `vite.config.ts` يستخدم `base: './'` لصالح حزم الموبايل.