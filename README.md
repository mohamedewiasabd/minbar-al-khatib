<div dir="rtl" align="center">

# منبر الخطيب الذكي — مولد خطب الجمعة

### صياغة خطب منبرية محكمة بالذكاء الاصطناعي، بلمسة إنسانية، وبحفظ سحابي كامل

[![Web](https://img.shields.io/badge/الويب-تطبيق_مباشر-0a3a2a?style=for-the-badge&logo=firebase)](https://minbar-khatib-app.web.app)
[![Play Store](https://img.shields.io/badge/Google_Play-تثبيت-18b34b?style=for-the-badge&logo=googleplay)](https://play.google.com/store/apps/details?id=com.minbar.khatib)
[![GitHub Release](https://img.shields.io/badge/releases-تنزيل_مباشر-181717?style=for-the-badge&logo=github)](https://github.com/mohamedewiasabd/minbar-al-khatib/releases)

</div>

---

## حول التطبيق

**منبر الخطيب الذكي** منصة ذكية مخصصة للخطباء وأئمة وخطباء الجمعة والعيد لصياغة خطب منبرية محكمة بالذكاء الاصطناعي، مع حفظ سحابي كامل لخطبك وتنظيمها، ودعم اللهجات الإقليمية، وتصدير بصيغ متعددة (Word / PDF / نص).

- 🤖 **توليد ذكي بالذكاء الاصطناعي** (Gemini) مع فحوصات شرعية وصحية للتوصيف المنبري.
- ☁️ **حساب سحابي** — حفظ خطبك ومزامنتها عبر كل أجهزتك (Google / بريد إلكتروني).
- 📂 **سلسلات خطب** — مناسبات (رمضان، العيد، الجمعة) وذكرى الهجرة والنصر.
- 🌍 **لهجات إقليمية** — صياغة تتناسب مع المنطقة (مصري، شامي، خليجي، مغاربي، عام…).
- 📤 **تصدير** Word / PDF / نص، ومشاركة مباشرة.
- 📱 **متوفر على**: ويب • أندرويد • ويندوز • لينكس • ماك • ايفون.

---

## روابط الموقع

| | الرابط |
|---|---|
| 🌐 تطبيق الويب المباشر | **https://minbar-khatib-app.web.app** |
| 📜 سياسة الخصوصية | **https://gen-lang-client-0686392114.web.app** |
| 📢 ملف `app-ads.txt` | `https://gen-lang-client-0686392114.web.app/app-ads.txt` |
| 🏪 صفحة بلاي ستور | `https://play.google.com/store/apps/details?id=com.minbar.khatib` |
| 📦 إصدارات التحميل المباشر | `https://github.com/mohamedewiasabd/minbar-al-khatib/releases` |

---

## التحميل على أجهزة لينكس 🐧

التوزيعات المختلفة تتلقى نفس الملفات الجوهرية (مسار تبعية واحدة) مع اختلاف في الطريقة:

| التوزيعة / الطريقة | الأمر / الخطوة |
|---|---|
| **Debian / Ubuntu / Mint** | `sudo apt install ./minbar-khatib_1.13.0_amd64.deb` |
| **AppImage (كل التوزيعات)** | `chmod +x minbar-khatib_1.13.0_amd64.AppImage && ./minbar-khatib_1.13.0_amd64.AppImage` |
| **Flatpak (Flathub)** | `flatpak install flathub com.minbar.khatib` — ⏳ جارٍ النشر (المانيفيست في `flatpak/` وفرع `com.minbar.khatib`) |
| **Arch / Manjaro (AUR)** | ⏳ جارٍ الإعداد — `PKGBUILD` جاهز في `packaging/aur/` |
| **Snap (Snapcraft)** | ⏳ مخطط له مستقبلاً |

> أي تقريب للـ AppImage فقط؟ استخدم **Gear Lever** أو **AppImageLauncher**: `sudo apt install appimagelauncher`.

### التنزيل المباشر حسب التوزيعة

1. افتح صفحة [الإصدارات](https://github.com/mohamedewiasabd/minbar-al-khatib/releases) على GitHub.
2. حمّل ملف النسخة المناسب لتوزيعتك:
   - **`.deb`** → أنظمة `dpkg` (Debian، Ubuntu، Mint، Pop!_OS، elementary، Zorin) — التثبيت: `sudo apt install ./minbar-khatib_*.deb`
   - **`.AppImage`** → أي توزيعة (بدون تثبيت، ملف واحد قابل للتنفيذ)
   - **`.exe` / `.msi`** → ويندوز 10/11
   - **`.dmg`** → ماك (Apple Silicon `_aarch64` / Intel `_x64`)
3. زوّر المتغير: يتوفر إضافياً `sha256sum -c SHA256SUMS-*.txt` للتحقق من سلامة الملفات.

### التحقق من سلامة الملفات (عام)

```bash
sha256sum minbar-khatib_1.13.0_amd64.deb
# قارن الرقم مع الناتج المرسوم في صفحة الإصدارات (SHA256SUMS)
```

---

## تطوير وبناء محلي

**المتطلبات:** Node.js 22+ و (لأجهزة سطح المكتب) Rust stable.

```bash
npm install                 # حزم الويب
npm run dev                 # تشغيل خادم التطوير Vite (منفذ 3000)
npm run build               # بناء الويب (dist/ + server.cjs)
npm start                   # تشغيل خادم الإنتاج (node dist/server.cjs)
```

| أمر | الناتج |
|---|---|
| `npm run desktop:build` | حزمة Tauri لنظامك الحالي (deb / AppImage على لينكس) |
| `npm run desktop:build:linux` | لينكس: `deb` + `AppImage` |
| `npm run android:release` | نسخة أندرويد موقّعة (يتطلب أسرار التوقيع) |
| `npm run ios:sync` | مزامنة منصة iOS |

> لبناء أندرويد موقّع يجب وجود مفتاح التوقيع وأسراره (ممنوع رفعها). راجع `AGENTS.md`.

---

## بنية التقنيات

`Capacitor 8` · `React 19` · `Vite 6` · `Tailwind 4` · `Tauri 2` · `Firebase (Auth + Firestore)` · `Google Gemini` · `AdMob`.

| المنصة | البنية | المستودع/الـ CI |
|---|---|---|
| ويب | Vite + Firebase Hosting | `minbar-khatib-app.web.app` |
| أندرويد | Capacitor 8 | `.github/workflows` + Gradle |
| ويندوز / لينكس / ماك | Tauri 2 | `.github/workflows/desktop.yml` |
| ايفون | Capacitor 8 | `.github/workflows/ios.yml` |

---

## المساهمة والملاحظات

وجدت خطأ أو لديك اقتراح؟ افتح [Issue](https://github.com/mohamedewiasabd/minbar-al-khatib/issues) وسنتكفل به.

<div dir="rtl" align="center">
  <sub>صنع بكل ❤️ لخدمة دُعاة الإسلام · <a href="https://gen-lang-client-0686392114.web.app">سياسة الخصوصية</a> · <a href="https://minbar-khatib-app.web.app/app-ads.txt">app-ads.txt</a></sub>
</div>