import React, { useState, useEffect } from 'react';
import { X, Coins, PlayCircle, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { isNativeApp } from '../lib/admob';

interface PointsGateModalProps {
  isOpen: boolean;
  points: number;
  cost: number;
  isSeries: boolean;
  isRegenerate?: boolean;
  isGenerating: boolean;
  onClose: () => void;
  onWatchAd: () => Promise<boolean>;
  onGoToProfile: () => void;
  onGenerate: () => void;
}

/**
 * نافذة تُفتح عندما يحاول المستخدم توليد خطبة دون رصيد كافٍ —
 * تتيح مشاهدة إعلان بكسب نقاط أو التوجه للبروفيل.
 */
export const PointsGateModal: React.FC<PointsGateModalProps> = ({
  isOpen,
  points,
  cost,
  isSeries,
  isRegenerate,
  isGenerating,
  onClose,
  onWatchAd,
  onGoToProfile,
  onGenerate,
}) => {
  const [watching, setWatching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const isNative = isNativeApp();

  useEffect(() => {
    if (isOpen) {
      setWatching(false);
      setMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const shortage = Math.max(0, cost - points);
  const enoughNow = points >= cost;

  const handleWatchAd = async () => {
    setWatching(true);
    setMessage(null);
    const earned = await onWatchAd();
    setWatching(false);
    if (earned) {
      setMessage('ممتاز! تمّت إضافة نقطة إلى رصيدك.');
    } else if (isNative) {
      setMessage('لم تكتمل مشاهدة الإعلان حتى النهاية، حاول مرة أخرى.');
    } else {
      setMessage('تمت إضافة النقطة بنجاح.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
        <div className="bg-gradient-to-br from-amber-500 via-amber-500 to-orange-500 p-5 text-white relative">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="absolute top-3 left-3 p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors cursor-pointer disabled:opacity-50"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cairo font-black text-lg">رصيدك لا يكفي {isRegenerate ? 'لإعادة التوليد' : 'للتوليد'}</h3>
              <p className="text-xs text-amber-50">شاهد إعلاناً بمكافأة لزيادة رصيدك والمتابعة فوراً</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-center gap-3">
            <div className="text-center flex-1 bg-stone-50 border border-stone-200 rounded-2xl py-4">
              <div className="text-[11px] text-stone-500 font-bold">رصيدك الحالي</div>
              <div className="font-cairo font-black text-3xl text-stone-800 mt-1 flex items-center justify-center gap-1">
                {points}
                <Coins className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <div className="text-stone-400 font-black text-2xl">−</div>
            <div className="text-center flex-1 bg-amber-50 border border-amber-200 rounded-2xl py-4">
              <div className="text-[11px] text-amber-700 font-bold">تكلفة {isSeries ? 'السلسلة' : 'الخطبة'}</div>
              <div className="font-cairo font-black text-3xl text-amber-700 mt-1 flex items-center justify-center gap-1">
                {cost}
                <Coins className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-sm text-stone-500">
            {enoughNow ? (
              <span className="text-emerald-700 font-bold">رصيدك الآن يكفي — اضغط "توليد الآن" للمتابعة.</span>
            ) : (
              <span>
                ينقصك <b className="text-amber-700">{shortage} نقاط</b> لإكمال التوليد.
              </span>
            )}
          </div>

          {message && (
            <div className={`mt-3 flex items-center gap-2 text-xs font-bold rounded-xl px-3 py-2 border ${
              message.startsWith('ممتاز') || message.startsWith('تمت')
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-100'
            }`}>
              {message.startsWith('لم') ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{message}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleWatchAd}
            disabled={watching}
            className={`mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-cairo font-bold text-sm text-white shadow-lg transition-all active:scale-95 cursor-pointer ${
              watching
                ? 'bg-stone-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600'
            }`}
          >
            {watching ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جاري عرض الإعلان...</span>
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5" />
                <span>شاهد إعلاناً واكسب نقطة واحدة</span>
              </>
            )}
          </button>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onGoToProfile}
              disabled={isGenerating}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-cairo font-bold text-xs text-stone-600 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>صفحة نقاطي</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="flex items-center justify-center py-2.5 rounded-xl font-cairo font-bold text-xs text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              <span>لاحقاً</span>
            </button>
          </div>

          {enoughNow && !isGenerating && (
            <button
              type="button"
              onClick={onGenerate}
              className="mt-3 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-cairo font-bold text-sm text-white shadow-lg bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-800 hover:to-emerald-700 transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>{isRegenerate ? 'إعادة التوليد' : 'توليد الآن'} ({isSeries ? 'سلسلة' : 'خطبة'} بتكلفة {cost} نقاط)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};