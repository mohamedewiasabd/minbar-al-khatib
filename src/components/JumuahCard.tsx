import React from 'react';
import { CalendarDays, Sparkles, WifiOff, BookOpenCheck } from 'lucide-react';

interface JumuahCardProps {
  sermonCount: number;
  offlineCount: number;
  onRandomSermon: () => void;
  onOpenOffline: () => void;
}

/** بطاقة الجمعة: عدّاد + تاريخ هجري + اختصارات تنوّع المحتوى */
const JumuahCard: React.FC<JumuahCardProps> = ({
  sermonCount,
  offlineCount,
  onRandomSermon,
  onOpenOffline,
}) => {
  const now = new Date();
  const day = now.getDay(); // الأحد = 0، الجمعة = 5
  const daysToFriday = (5 - day + 7) % 7;
  const isFridayToday = daysToFriday === 0;

  const hijriDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);

  return (
    <div className="bg-gradient-to-l from-emerald-900 via-[#123328] to-stone-900 text-white rounded-3xl border border-emerald-700/50 shadow-lg p-5 sm:p-6 mb-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700/70 border border-emerald-500/40 text-amber-300 flex items-center justify-center shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <p className="text-emerald-300 text-[11px] font-bold">الجمعة القادمة</p>
            <h2 className="font-cairo font-extrabold text-lg sm:text-xl mt-0.5">
              {isFridayToday ? 'اليوم يوم الجمعة — الجمعة المباركة' : `باقي ${daysToFriday} ${daysToFriday === 1 ? 'يوم' : 'أيام'} على الجمعة`}
            </h2>
            <p className="text-stone-300 text-xs mt-1">{hijriDate}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRandomSermon}
            disabled={sermonCount === 0}
            className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-stone-900 px-3.5 py-2.5 rounded-xl text-xs font-cairo font-extrabold transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            خطبة عشوائية
          </button>
          <button
            type="button"
            onClick={onOpenOffline}
            className="inline-flex items-center gap-2 bg-emerald-800/80 hover:bg-emerald-700 border border-emerald-500/50 text-emerald-100 px-3.5 py-2.5 rounded-xl text-xs font-cairo font-bold transition-all active:scale-95 cursor-pointer"
          >
            <WifiOff className="w-4 h-4 text-amber-300" />
            المحفوظة دون اتصال
            {offlineCount > 0 && (
              <span className="bg-amber-400 text-stone-900 rounded-full px-1.5 text-[10px] font-black">
                {offlineCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {sermonCount > 0 && (
        <div className="mt-4 flex items-center gap-2 text-[11px] text-stone-400 border-t border-white/10 pt-3">
          <BookOpenCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{sermonCount} خطبة متاحة الآن في مكتبة المنبر — اختر ما يناسب مناسبتك.</span>
        </div>
      )}
    </div>
  );
};

export default JumuahCard;
