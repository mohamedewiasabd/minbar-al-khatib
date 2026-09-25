import React, { useEffect, useRef, useState } from 'react';
import { isNativeApp } from '../lib/admob';
import { useAdMob } from '../context/AdMobContext';
import { Megaphone } from 'lucide-react';

interface AdSlotProps {
  /** حجم الفتحة الإعلانية داخل تدفق المحتوى */
  variant?: 'inContent' | 'divider';
  /** مفتاح فريد يسمح بإظهار فتحة واحدة فقط في نفس الوقت */
  slotId?: string;
}

/**
 * فتحة إعلانية مدمجة داخل تدفق المحتوى (وحدات إعلانية متقدمة).
 * في التطبيق الأصلي (Capacitor) تُظهر إعلان متوسط المستطيل 300x250 داخل المحتوى.
 * في المتصفح لا تُظهر شيئاً أثناء التطوير.
 */
export const AdSlot: React.FC<AdSlotProps> = ({ variant = 'inContent', slotId = 'default' }) => {
  const { activeAdSlotId, registerAdSlot, unregisterAdSlot } = useAdMob();
  const isNative = isNativeApp();
  const [visible, setVisible] = useState(false);
  const mountedRef = useRef(false);

  // سجلّ الفتحة عند التركيب، ثم حدّث حالة الظهور بناءً على الفتحة النشطة
  useEffect(() => {
    mountedRef.current = true;
    registerAdSlot(slotId);
    return () => {
      mountedRef.current = false;
      unregisterAdSlot(slotId);
    };
  }, [slotId, registerAdSlot, unregisterAdSlot]);

  useEffect(() => {
    const isActive = activeAdSlotId === slotId;
    const shouldBeVisible = mountedRef.current && isActive;
    setVisible(shouldBeVisible);
  }, [activeAdSlotId, slotId]);

  if (!isNative) return null;

  if (!visible) {
    // المنزلق غير النشط يعيد مساحة صغيرة فقط (لا يستهلك طلب إعلان)
    return <div className="h-6" aria-hidden="true" />;
  }

  if (variant === 'divider') {
    return (
      <div className="flex items-center justify-center gap-3 py-4 text-stone-400" aria-label="إعلان">
        <div className="h-px bg-stone-200 flex-1" />
        <span className="text-[10px] font-bold tracking-widest">إعلان</span>
        <div className="h-px bg-stone-200 flex-1" />
      </div>
    );
  }

  // فتحة داخل المحتوى: مساحة مستطيلة تحمل الإعلان (300x250)
  return (
    <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="w-full flex items-center justify-between px-3 py-1 bg-stone-50/80 border-b border-stone-100">
        <span className="text-[10px] font-bold text-stone-400 tracking-widest">
          إعلان
        </span>
        <Megaphone className="w-3 h-3 text-stone-300" />
      </div>
      <div className="w-full flex items-center justify-center" style={{ minHeight: 250 }}>
        {/* يتم رسم الإعلان الأصلي فوق هذه المساحة عبر إضافة AdMob */}
        <span className="text-[10px] text-stone-300">&nbsp;</span>
      </div>
    </div>
  );
};