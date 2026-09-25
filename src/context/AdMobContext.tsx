import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  initAdMob,
  isNativeApp,
  prepareRewardedAd,
  showAppOpenAd,
  showBottomBanner,
  showInContentAd,
  dismissInContentAd,
  hideBanner,
} from '../lib/admob';

interface AdMobContextValue {
  /** هل نحن داخل التطبيق الأصلي (موبايل)؟ */
  isNative: boolean;
  /** هل تم تهيئة أدموب بنجاح؟ */
  adMobReady: boolean;
  /** إظهار البانر في أسفل الواجهة */
  showBanner: () => Promise<boolean>;
  /** إخفاء البانر */
  hideBanner: () => Promise<boolean>;
  /** تسجيل فتحة إعلانية مدمجة داخل المحتوى (تظهر فتحة واحدة فقط) */
  registerAdSlot: (slotId: string) => void;
  /** إلغاء تسجيل الفتحة */
  unregisterAdSlot: (slotId: string) => void;
  /** الفتحة النشطة حالياً */
  activeAdSlotId: string | null;
  /** إغلاق الإعلان المدمج الحالي (مرة واحدة لهذه الجلسة) */
  dismissAdSlot: (slotId: string) => void;
}

const AdMobContext = createContext<AdMobContextValue>({
  isNative: false,
  adMobReady: false,
  showBanner: async () => false,
  hideBanner: async () => true,
  registerAdSlot: () => {},
  unregisterAdSlot: () => {},
  activeAdSlotId: null,
  dismissAdSlot: () => {},
});

export function AdMobProvider({ children }: { children: React.ReactNode }) {
  const [isNative] = useState<boolean>(() => isNativeApp());
  const [adMobReady, setAdMobReady] = useState<boolean>(false);
  // قائمة الفتحات المدمجة حسب ترتيب التمرير (تظهر واحدة فقط لتجنّب تعارض البانر)
  const [adSlots, setAdSlots] = useState<string[]>([]);
  // نمنع إظهار إعلان فتح التطبيق داخل React StrictMode
  const appOpenShownRef = useRef(false);
  const activeSlotRef = useRef<string | null>(null);
  // الفتحات التي أغلقها المستخدم — لا تعود في هذه الجلسة
  const dismissedSlotsRef = useRef<Set<string>>(new Set());

  const registerAdSlot = useCallback((slotId: string) => {
    if (dismissedSlotsRef.current.has(slotId)) return;
    setAdSlots((prev) => (prev.includes(slotId) ? prev : [...prev, slotId]));
  }, []);

  const unregisterAdSlot = useCallback((slotId: string) => {
    setAdSlots((prev) => prev.filter((id) => id !== slotId));
  }, []);

  const dismissAdSlot = useCallback((slotId: string) => {
    dismissedSlotsRef.current.add(slotId);
    activeSlotRef.current = null;
    setAdSlots((prev) => prev.filter((id) => id !== slotId));
    dismissInContentAd().catch(() => {});
  }, []);

  // إظهار إعلان الفتحة النشطة فقط
  useEffect(() => {
    if (!isNative || !adMobReady) return;
    const active = adSlots[0] ?? null;
    if (active === activeSlotRef.current) return;
    activeSlotRef.current = active;
    if (active) {
      showInContentAd().catch(() => {});
    } else {
      hideBanner().catch(() => {});
    }
  }, [adSlots, isNative, adMobReady]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!isNative) return;

      const ready = await initAdMob();
      if (cancelled) return;
      setAdMobReady(ready);

      if (ready) {
        // تحميل الإعلان بمكافأة مسبقاً
        await prepareRewardedAd();
        // إعلان فتح التطبيق مرة واحدة فقط
        if (!appOpenShownRef.current) {
          appOpenShownRef.current = true;
          await showAppOpenAd();
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [isNative]);

  const showBannerAsync = useCallback(async (): Promise<boolean> => {
    // لا نعرض البانر السفلي أثناء وجود إعلان مدمج داخل المحتوى
    if (activeSlotRef.current) {
      await hideBanner();
      return false;
    }
    return showBottomBanner();
  }, []);

  const hideBannerAsync = useCallback(async (): Promise<boolean> => hideBanner(), []);

  // الإعلان المدمج الحالي المعروض
  const activeAdSlotId = adSlots[0] ?? null;

  const value: AdMobContextValue = {
    isNative,
    adMobReady,
    showBanner: showBannerAsync,
    hideBanner: hideBannerAsync,
    registerAdSlot,
    unregisterAdSlot,
    activeAdSlotId,
    dismissAdSlot,
  };

  return (
    <AdMobContext.Provider value={value}>
      {children}
      {/* زر إغلاق الإعلان المدمج: يظهر فوق الإعلان ليتمكن المستخدم من إغلاقه */}
      {isNative && activeAdSlotId && (
        <button
          type="button"
          aria-label="إغلاق الإعلان"
          onClick={() => dismissAdSlot(activeAdSlotId)}
          className="fixed z-50 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white shadow-lg"
          style={{ top: '60px', right: '12px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}
    </AdMobContext.Provider>
  );
}

export function useAdMob(): AdMobContextValue {
  return useContext(AdMobContext);
}