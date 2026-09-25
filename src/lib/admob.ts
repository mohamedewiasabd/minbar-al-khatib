import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdPosition, BannerAdSize, MaxAdContentRating } from '@capacitor-community/admob';

// ======================= إعدادات أدموب =======================
// App ID: ca-app-pub-6559329089674801~6255814909
export const ADMOB_CONFIG = {
  // بانر
  BANNER_ID: 'ca-app-pub-6559329089674801/2773086655',
  // وحدات إعلانية متقدمة مدمجة مع المحتوى (Native Advanced)
  NATIVE_ID: 'ca-app-pub-6559329089674801/6064243214',
  // إعلان على شاشة فتح التطبيق (App Open)
  APP_OPEN_ID: 'ca-app-pub-6559329089674801/8690406553',
  // بيني بمكافأة (Rewarded)
  REWARDED_ID: 'ca-app-pub-6559329089674801/5433330000',
};

// الوحدات الحقيقية مفعّلة الآن — لا نستخدم وحدات الاختبار التجريبي في التطبيق النهائي
export const USE_TEST_ADS = false;

// إرجاع المعرّف المناسب (اختباري أو حقيقي)
const nativeAdId = (key: keyof typeof ADMOB_CONFIG): string => ADMOB_CONFIG[key];

// هل نعمل داخل تطبيق الموبايل الأصلي (Capacitor)؟
export const isNativeApp = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

let initialized = false;

/**
 * تهيئة صفحة أدموب SDK مرة واحدة
 */
export async function initAdMob(): Promise<boolean> {
  if (!isNativeApp()) return false;
  if (initialized) return true;
  try {
    await AdMob.initialize({
      maxAdContentRating: MaxAdContentRating.General,
      tagForChildDirectedTreatment: false,
    });
    initialized = true;
    console.log('[AdMob] Initialized successfully');
    return true;
  } catch (err) {
    console.warn('[AdMob] Initialization failed:', err);
    return false;
  }
}

// ======================= إعلان البانر =======================

export async function showBottomBanner(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    await AdMob.showBanner({
      adId: nativeAdId('BANNER_ID'),
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 12,
    });
    return true;
  } catch (err) {
    console.warn('[AdMob] Banner show failed:', err);
    return false;
  }
}

export async function hideBanner(): Promise<boolean> {
  if (!isNativeApp()) return true;
  try {
    await AdMob.hideBanner();
    return true;
  } catch {
    return false;
  }
}

export async function removeBanner(): Promise<boolean> {
  if (!isNativeApp()) return true;
  try {
    await AdMob.removeBanner();
    return true;
  } catch {
    return false;
  }
}

/**
 * إغلاق الإعلان المدمج نهائياً (إزالة البانر من شجرة العرض)
 */
export async function dismissInContentAd(): Promise<boolean> {
  if (!isNativeApp()) return true;
  try {
    await AdMob.removeBanner();
    console.log('[AdMob] In-content ad dismissed');
    return true;
  } catch (err) {
    console.warn('[AdMob] In-content dismiss failed:', err);
    try {
      await AdMob.hideBanner();
      return true;
    } catch {
      return false;
    }
  }
}

export async function resumeBanner(): Promise<boolean> {
  if (!isNativeApp()) return true;
  try {
    await AdMob.resumeBanner();
    return true;
  } catch {
    return false;
  }
}

/**
 * إظهار إعلان مستطيل (300x250) مدمج داخل المحتوى بين بطاقات الخطب
 * يستخدم وحدة البانر لملء القالب الداخلي
 */
export async function showInContentAd(position: BannerAdPosition = BannerAdPosition.CENTER): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    await AdMob.showBanner({
      adId: nativeAdId('BANNER_ID'),
      adSize: BannerAdSize.MEDIUM_RECTANGLE,
      position,
      margin: 0,
    });
    return true;
  } catch (err) {
    console.warn('[AdMob] In-content ad failed:', err);
    return false;
  }
}

// ======================= إعلان App Open =======================

export async function showAppOpenAd(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    await AdMob.loadAppOpen({ adId: nativeAdId('APP_OPEN_ID') });
    await AdMob.showAppOpen();
    console.log('[AdMob] App Open ad shown');
    return true;
  } catch (err) {
    console.warn('[AdMob] App Open ad failed:', err);
    return false;
  }
}

// ======================= إعلان المكافأة =======================

let rewardedReady = false;
let preparingRewarded = false;

// وجهات حدث تحميل/عرض الإعلان المكافئ للتشخيص فقط
type RewardStateListener = () => void;
const rewardedListeners: RewardStateListener[] = [];

export function subscribeRewarded(cb: RewardStateListener): () => void {
  rewardedListeners.push(cb);
  return () => {
    const i = rewardedListeners.indexOf(cb);
    if (i >= 0) rewardedListeners.splice(i, 1);
  };
}

function notifyRewarded() {
  rewardedListeners.forEach((cb) => cb());
}

export async function prepareRewardedAd(): Promise<boolean> {
  if (!isNativeApp()) return false;
  if (preparingRewarded) return rewardedReady;
  preparingRewarded = true;
  try {
    await AdMob.prepareRewardVideoAd({
      adId: nativeAdId('REWARDED_ID'),
      isTesting: false,
      ssv: { customData: 'stage-friday-sermon' },
    });
    rewardedReady = true;
    console.log('[AdMob] Rewarded ad ready');
  } catch (err) {
    console.warn('[AdMob] Rewarded prep failed:', err);
    rewardedReady = false;
  } finally {
    preparingRewarded = false;
    notifyRewarded();
  }
  return rewardedReady;
}

/**
 * عرض إعلان بمكافأة والعودة بنتيجة: هل حصل المستخدم على المكافأة؟
 */
export async function showRewardedAd(): Promise<{ rewarded: boolean; amount?: number }> {
  if (!isNativeApp()) {
    // في المتصفح (وضع التطوير) نفتح المكافأة مباشرة للتجربة
    return { rewarded: true, amount: 1 };
  }
  // إن لم نكن جاهزين (فشل التحميل أو بعد استهلاك إعلان) نحاول تحميل إعلان جديد أولاً
  if (!rewardedReady) {
    await prepareRewardedAd();
    if (!rewardedReady) {
      console.warn('[AdMob] No rewarded ad available');
      return { rewarded: false };
    }
  }
  try {
    const reward = await AdMob.showRewardVideoAd();
    rewardedReady = false; // الإعلان مستهلك، يُعاد تحميله عند الطلب التالي
    notifyRewarded();
    // تجهيز الإعلان التالي مسبقاً لسلاسة التجربة
    prepareRewardedAd().catch(() => {});
    return { rewarded: true, amount: reward.amount };
  } catch (err) {
    console.warn('[AdMob] Rewarded show cancelled/failed:', err);
    rewardedReady = false;
    notifyRewarded();
    return { rewarded: false };
  }
}