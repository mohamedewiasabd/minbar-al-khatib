import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.minbar.khatib',
  appName: 'منبر الخطيب',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // عند البناء النهائي للنسخة الأصلية ضع هنا رابط السيرفر المنشور (Cloud Run)
    // مثال: url: 'https://YOUR_CLOUD_RUN_URL.run.app'
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#fafaf9',
  },
  plugins: {
    FirebaseAuthentication: {
      // نستخدم Firebase JS SDK داخل الويبفيو لذا نأخذ التوكن فقط ونكمل التسجيل عبر signInWithCredential
      skipNativeAuth: true,
      providers: ['google.com'],
    },
    AdMob: {
      // App ID الخاص بأدموب
      appId: 'ca-app-pub-6559329089674801~6255814909',
      // وضع الإصدار النهائي — إعلانات حقيقية فقط
      testingMode: false,
      admobDebugEnabled: false,
      initializeForTesting: false,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a3a2a',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
};

export default config;