import React, { useState } from 'react';
import {
  RotateCw,
  Sparkles,
  X,
  Layers,
  Clock,
  Feather,
  Sliders,
  FolderTree,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lock
} from 'lucide-react';
import { Sermon, SermonLength, SermonComplexity, SermonTone } from '../types';
import { useAuth } from '../context/AuthContext';


interface RegenerateSermonModalProps {
  sermon: Sermon;
  isOpen: boolean;
  onClose: () => void;
  onConfirmRegenerate: (options: {
    customInstructions?: string;
    replaceExisting: boolean;
    length?: SermonLength;
    complexity?: SermonComplexity;
    tone?: SermonTone;
  }) => Promise<void>;
  onOpenInGenerator: (sermon: Sermon) => void;
  isLoading: boolean;
}

export const RegenerateSermonModal: React.FC<RegenerateSermonModalProps> = ({
  sermon,
  isOpen,
  onClose,
  onConfirmRegenerate,
  onOpenInGenerator,
  isLoading,
}) => {
  const { isAdmin, openLoginModal } = useAuth();
  if (!isOpen) return null;

  const isSeries = !!sermon.isSeries;
  const partsCount = sermon.seriesParts?.length || sermon.totalSeriesParts || 3;

  const [customInstructions, setCustomInstructions] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [selectedLength, setSelectedLength] = useState<SermonLength>(sermon.length || 'medium');
  const [selectedComplexity, setSelectedComplexity] = useState<SermonComplexity>(sermon.complexity || 'simple');
  const [selectedTone, setSelectedTone] = useState<SermonTone>(sermon.tone || 'exhortative');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      openLoginModal('إعادة توليد وصياغة الخطبة بالذكاء الاصطناعي مخصصة لمسؤول المنبر (Admin) فقط.');
      return;
    }
    await onConfirmRegenerate({
      customInstructions: customInstructions.trim(),
      replaceExisting,
      length: selectedLength,
      complexity: selectedComplexity,
      tone: selectedTone,
    });
  };


  const getLengthDesc = (len: SermonLength) => {
    switch (len) {
      case 'short': return 'موجزة ومحكمة (~2000 كلمة • 10 دقائق)';
      case 'medium': return 'معتدلة نموذجية (~3000 كلمة • 15-18 دقيقة)';
      case 'long': return 'مفصلة وموسعة (~4000 كلمة • 20-25 دقيقة)';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-fade-in" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700/60 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
              <RotateCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="font-cairo font-bold text-lg text-white">
                {isSeries ? 'إعادة صياغة وتوليد سلسلة الخطب' : 'إعادة صياغة وتوليد الخطبة'}
              </h3>
              <p className="text-xs text-emerald-200/90 font-medium">
                توليد صياغة جديدة متكاملة بالذكاء الاصطناعي مع الحفاظ على الأفكار والشواهد
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-stone-300 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-right">
          
          {/* Current Sermon Target Box */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              الهدف الحالي:
            </span>
            <h4 className="font-bold text-stone-900 text-base leading-snug">
              {sermon.title}
            </h4>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="inline-flex items-center gap-1 bg-emerald-100/80 text-emerald-900 px-2.5 py-0.5 rounded-md font-semibold border border-emerald-200">
                <FolderTree className="w-3 h-3 text-emerald-700" />
                <span>{sermon.category || 'العقيدة والإيمان'}</span>
              </span>
              {isSeries && (
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-md font-semibold border border-amber-200">
                  <Layers className="w-3 h-3 text-amber-700" />
                  <span>سلسلة ({partsCount} خطب)</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1 bg-stone-200/80 text-stone-700 px-2.5 py-0.5 rounded-md font-medium">
                <Clock className="w-3 h-3 text-stone-500" />
                <span>{getLengthDesc(selectedLength)}</span>
              </span>
            </div>
          </div>

          {/* Optional Additional Guidance Input */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-xs font-bold text-stone-700">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>توجيهات أو تعديلات خاصة للصياغة الجديدة (اختياري):</span>
              </span>
              <span className="text-[11px] text-stone-400 font-normal">اختياري</span>
            </label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="مثال: ركز أكثر على أثر ذلك في استقرار الأسرة، اذكر نماذج واقعية من حياة السلف، اجعل الخاتمة أكثر تأثيراً ورجاءً..."
              rows={3}
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-stone-900 placeholder:text-stone-400 text-xs sm:text-sm resize-none"
            />
            <p className="text-[11px] text-stone-500 leading-relaxed">
              سيقوم المحرك الذكي بصياغة نسخة بديلة متجددة بأسلوب «السهل الممتنع البليغ»، مع استيفاء عناصر الخطبتين وجلسة الاستراحة والدعاء.
            </p>
          </div>

          {/* Replace vs Keep Both Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700 block">
              كيف ترغب في حفظ الخطبة بعد إعادة توليدها؟
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label
                className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  replaceExisting
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                }`}
              >
                <input
                  type="radio"
                  name="replace-option"
                  checked={replaceExisting}
                  onChange={() => setReplaceExisting(true)}
                  disabled={isLoading}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-stone-900">استبدال الخطبة الحالية</div>
                  <div className="text-[11px] text-stone-500 font-normal">
                    تحديث محتوى هذه الخطبة في السحابة بالصياغة الجديدة مباشرة.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  !replaceExisting
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                }`}
              >
                <input
                  type="radio"
                  name="replace-option"
                  checked={!replaceExisting}
                  onChange={() => setReplaceExisting(false)}
                  disabled={isLoading}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-stone-900">حفظ كخطبة جديدة مستقلة</div>
                  <div className="text-[11px] text-stone-500 font-normal">
                    إبقاء الخطبة الأصلية وإضافة النسخة الجديدة كخطبة منفصلة في القائمة.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Quick Adjustments Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'إخفاء خيارات الطول والأسلوب' : 'تعديل سريع للطول ومستوى اللغة...'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 p-3.5 bg-stone-50 border border-stone-200 rounded-2xl space-y-3 animate-fade-in text-xs">
                <div>
                  <span className="font-bold text-stone-700 block mb-1">طول الخطبة:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'short', label: 'مختصرة (~2000 ك)' },
                      { id: 'medium', label: 'معتدلة (~3000 ك)' },
                      { id: 'long', label: 'مفصلة (~4000 ك)' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedLength(item.id as SermonLength)}
                        className={`p-2 rounded-lg text-center font-bold border transition-all ${
                          selectedLength === item.id
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-stone-700 block mb-1">مستوى البلاغة واللغة:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'simple', label: 'السهل الممتنع' },
                      { id: 'moderate', label: 'فصيح متوازن' },
                      { id: 'eloquent', label: 'بلاغي رفيع' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedComplexity(item.id as SermonComplexity)}
                        className={`p-2 rounded-lg text-center font-bold border transition-all ${
                          selectedComplexity === item.id
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions Footer */}
          <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenInGenerator(sermon);
              }}
              disabled={isLoading}
              className="text-xs font-bold text-stone-600 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <span>فتح في نموذج المنشئ لتعديل شامل</span>
            </button>

            <div className="flex items-center gap-2 mr-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 border border-stone-200 transition-all cursor-pointer disabled:opacity-50"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] ${
                  !isAdmin
                    ? 'bg-stone-800 text-amber-300 border border-amber-500/40 hover:bg-stone-700'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-900/20'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>جاري إعادة الصياغة...</span>
                  </>
                ) : !isAdmin ? (
                  <>
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>تأكيد وبدء التوليد (مشرف فقط)</span>
                  </>
                ) : (
                  <>
                    <RotateCw className="w-4 h-4" />
                    <span>تأكيد وبدء التوليد</span>
                  </>
                )}
              </button>

            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
