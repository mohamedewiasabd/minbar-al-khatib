import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Printer,
  FileText,
  Mic,
  Clock,
  BookOpen,
  Share2,
  Check,
  Eye,
  Tag,
  Sparkles,
  Bookmark,
  FolderTree,
  Edit3,
  RotateCw,
  Trash2,
  Lock
} from 'lucide-react';
import { Sermon, SeriesPart } from '../types';
import { useAuth } from '../context/AuthContext';


interface SermonReaderModalProps {
  sermon: Sermon;
  activePart?: SeriesPart | null;
  onClose: () => void;
  onDownload: (sermon: Sermon, format: 'word' | 'txt' | 'print', part?: SeriesPart | null) => void;
  onOpenTeleprompter: (part?: SeriesPart | null) => void;
  onEdit?: (sermon: Sermon, part?: SeriesPart | null) => void;
  onRegenerate?: (sermon: Sermon) => void;
  onDelete?: (id: string) => void;
}

export const SermonReaderModal: React.FC<SermonReaderModalProps> = ({
  sermon,
  activePart,
  onClose,
  onDownload,
  onOpenTeleprompter,
  onEdit,
  onRegenerate,
  onDelete,
}) => {
  const { isAdmin, user, openLoginModal } = useAuth();
  const [selectedPart, setSelectedPart] = useState<SeriesPart | null>(
    activePart || (sermon.seriesParts && sermon.seriesParts.length > 0 ? sermon.seriesParts[0] : null)
  );
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);


  // Keyboard close support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Sync to externally requested part (e.g. opened from Home/Dashboard series list)
  useEffect(() => {
    if (activePart && sermon.seriesParts) {
      const match = sermon.seriesParts.find((p) => p.partNumber === activePart.partNumber);
      if (match) setSelectedPart(match);
    }
  }, [activePart, sermon]);

  const currentTitle = selectedPart ? `${sermon.title} - ${selectedPart.title}` : sermon.title;
  const intro = selectedPart ? selectedPart.intro : sermon.intro;
  const firstKhutbah = selectedPart ? selectedPart.firstKhutbah : sermon.firstKhutbah;
  const pauseAdvice = selectedPart ? selectedPart.pauseAdvice : sermon.pauseAdvice;
  const secondKhutbah = selectedPart ? selectedPart.secondKhutbah : sermon.secondKhutbah;
  const supplication = selectedPart ? selectedPart.supplication : sermon.supplication;
  const mainPoints = selectedPart ? selectedPart.mainPoints : sermon.mainPoints;
  const quranCitations = selectedPart ? selectedPart.quranCitations : sermon.quranCitations;
  const hadithCitations = selectedPart ? selectedPart.hadithCitations : sermon.hadithCitations;
  const estimatedMinutes = selectedPart ? selectedPart.estimatedMinutes : sermon.estimatedMinutes;
  const wordCount = selectedPart ? selectedPart.wordCount : sermon.wordCount;

  const fontClasses = {
    normal: 'text-lg sm:text-xl leading-loose',
    large: 'text-xl sm:text-2xl leading-[2.2]',
    xlarge: 'text-2xl sm:text-3xl leading-[2.4]',
  };

  const handleCopyText = () => {
    const text = `${currentTitle}\n\n${intro}\n\n${firstKhutbah}\n\n${pauseAdvice}\n\n${secondKhutbah}\n\n${supplication}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-sm overflow-y-auto animate-fade-in" dir="rtl">
      
      <div className="relative w-full max-w-4xl bg-[#fffdf9] rounded-3xl shadow-2xl border border-stone-300/80 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-3.5 sm:px-6 py-3 border-b border-stone-200 bg-stone-900 text-white flex-shrink-0 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-xs text-emerald-400 font-bold block truncate">
                نافذة القراءة والاطلاع المنبري
              </span>
              <h3 className="font-cairo font-bold text-xs sm:text-base text-white truncate">
                {currentTitle}
              </h3>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-1.5 shrink-0">
            {onRegenerate && (
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    openLoginModal('لإعادة صياغة الخطبة بالنقاط، يرجى تسجيل الدخول بحساب Google.');
                  } else {
                    onClose();
                    onRegenerate(sermon);
                  }
                }}
                className="flex items-center gap-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 hover:text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border border-emerald-600/40"
                title="إعادة صياغة الخطبة بالذكاء الاصطناعي"
              >
                <RotateCw className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden xs:inline sm:inline">إعادة توليد</span>
                {!user && <Lock className="w-3 h-3 text-stone-400" />}
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  if (!isAdmin) {
                    openLoginModal('تعديل الخطبة وأقسامها مخصص لمسؤول المنبر (Admin) فقط.');
                  } else {
                    onEdit(sermon, selectedPart);
                  }
                }}
                className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border border-emerald-500/50"
                title="تعديل الخطبة أو تغيير القسم الشرعي"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden xs:inline sm:inline">تعديل</span>
                {!isAdmin && <Lock className="w-3 h-3 text-stone-300" />}
              </button>
            )}

            {onDelete && (
              confirmDelete ? (
                <div className="flex items-center gap-1 bg-red-950/90 border border-red-500/70 p-1 rounded-xl text-xs animate-fade-in">
                  <span className="text-red-200 text-[11px] font-bold px-1">متأكد؟</span>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(sermon.id);
                      setConfirmDelete(false);
                      onClose();
                    }}
                    className="bg-red-600 hover:bg-red-500 text-white px-2 py-0.5 rounded-lg font-bold text-xs cursor-pointer"
                  >
                    حذف
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="text-stone-300 hover:text-white px-1 py-0.5 text-xs cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!isAdmin) {
                      openLoginModal('حذف الخطب مخصص لمسؤول المنبر (Admin) فقط.');
                    } else {
                      setConfirmDelete(true);
                    }
                  }}
                  className="p-1.5 text-stone-400 hover:text-red-300 hover:bg-red-950/60 rounded-xl transition-all cursor-pointer border border-stone-700/40"
                  title="حذف الخطبة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )
            )}


            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition-all cursor-pointer mr-1"
              title="إغلاق النافذة (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Header: Stats & Download Buttons */}
        <div className="bg-stone-50 border-b border-stone-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 text-xs sm:text-sm">
          
          {/* Public Stats & Badges */}
          <div className="flex items-center flex-wrap gap-2 text-stone-600">
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold px-2.5 py-1 rounded-lg">
              <FolderTree className="w-3.5 h-3.5 text-emerald-700" />
              <span>القسم: {sermon.category || (sermon.isSeries ? 'سلاسل منبرية متكاملة' : 'العقيدة والإيمان')}</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-amber-100/80 text-amber-800 font-bold px-2.5 py-1 rounded-lg">
              <Download className="w-3.5 h-3.5" />
              <span>{sermon.downloadsCount || 0} تنزيل</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-purple-100/80 text-purple-800 font-bold px-2.5 py-1 rounded-lg">
              <Eye className="w-3.5 h-3.5" />
              <span>{sermon.viewsCount || 0} قراءة</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-emerald-100/80 text-emerald-800 font-medium px-2.5 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5" />
              <span>{estimatedMinutes || 15} دقيقة إلقاء</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-stone-200/80 text-stone-700 font-medium px-2.5 py-1 rounded-lg">
              <FileText className="w-3.5 h-3.5" />
              <span>{wordCount || 0} كلمة</span>
            </span>
          </div>

          {/* Quick Actions & Font Size Selector */}
          <div className="flex items-center flex-wrap gap-2">
            
            {/* Font size toggles */}
            <div className="flex items-center bg-stone-200/70 p-0.5 rounded-lg text-xs font-bold text-stone-700">
              <button
                onClick={() => setFontSize('normal')}
                className={`px-2 py-1 rounded-md transition-all ${fontSize === 'normal' ? 'bg-white text-stone-900 shadow-sm' : 'hover:text-stone-950'}`}
              >
                أصغر
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-2 py-1 rounded-md transition-all ${fontSize === 'large' ? 'bg-white text-stone-900 shadow-sm' : 'hover:text-stone-950'}`}
              >
                متوسط
              </button>
              <button
                onClick={() => setFontSize('xlarge')}
                className={`px-2 py-1 rounded-md transition-all ${fontSize === 'xlarge' ? 'bg-white text-stone-900 shadow-sm' : 'hover:text-stone-950'}`}
              >
                أكبر
              </button>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 font-medium transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
            </button>

            {/* Direct Downloads */}
            <button
              onClick={() => onDownload(sermon, 'word', selectedPart)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold shadow-sm transition-all"
              title="تنزيل منسق لبرنامج Word جاهز للطباعة"
            >
              <Download className="w-4 h-4" />
              <span>تنزيل Word</span>
            </button>

            <button
              onClick={() => onDownload(sermon, 'print', selectedPart)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-white font-medium transition-all"
              title="طباعة منبرية أو حفظ PDF"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / PDF</span>
            </button>

            <button
              onClick={() => onOpenTeleprompter(selectedPart)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold transition-all"
              title="فتح المحراب المنبري التفاعلي للإلقاء"
            >
              <Mic className="w-4 h-4" />
              <span>وضع المنبر</span>
            </button>

          </div>

        </div>

        {/* Series Navigation Tabs if series */}
        {sermon.isSeries && sermon.seriesParts && sermon.seriesParts.length > 1 && (
          <div className="bg-stone-100/80 px-6 py-2 border-b border-stone-200 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-stone-600 flex-shrink-0">أجزاء السلسلة:</span>
            {sermon.seriesParts.map((part) => (
              <button
                key={part.partNumber}
                onClick={() => setSelectedPart(part)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                  selectedPart?.partNumber === part.partNumber
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-300'
                }`}
              >
                الجمعة {part.partNumber}: {part.title}
              </button>
            ))}
          </div>
        )}

        {/* Sermon Body: Traditional Arabic Reader */}
        <div className="p-6 sm:p-10 overflow-y-auto font-traditional text-stone-900 space-y-8 max-w-3xl mx-auto w-full">
          
          {/* Main Title & Basmalah */}
          <div className="text-center space-y-3 pb-6 border-b border-stone-200">
            <p className="font-amiri text-2xl sm:text-3xl text-emerald-800 font-bold tracking-wide">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <h1 className="font-cairo font-black text-2xl sm:text-3xl text-stone-900 leading-snug">
              {currentTitle}
            </h1>
            <div className="flex items-center justify-center gap-2 text-xs font-sans text-stone-500">
              <span>الموضوع: {sermon.topic}</span>
              <span>•</span>
              <span>التصنيف: {sermon.category || 'العقيدة والإيمان'}</span>
            </div>
          </div>

          {/* Main Points Box */}
          {mainPoints && mainPoints.length > 0 && (
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 font-sans">
              <h4 className="font-cairo font-bold text-sm sm:text-base text-emerald-950 mb-2.5 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-emerald-700" />
                <span>عناصر ومحاور الخطبة:</span>
              </h4>
              <ul className="space-y-1.5 text-xs sm:text-sm text-emerald-900 pr-4 list-disc list-inside">
                {mainPoints.map((pt, i) => (
                  <li key={i} className="leading-relaxed">{pt}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Intro / Khutbat Al-Hajah */}
          <section className="space-y-3">
            <h3 className="font-cairo font-bold text-lg sm:text-xl text-emerald-900 border-r-4 border-emerald-600 pr-3">
              المقدمة (خطبة الحاجة والاستفتاح)
            </h3>
            <div className={`${fontClasses[fontSize]} text-stone-800 whitespace-pre-line text-justify`}>
              {intro}
            </div>
          </section>

          {/* First Khutbah */}
          <section className="space-y-3">
            <h3 className="font-cairo font-bold text-lg sm:text-xl text-emerald-900 border-r-4 border-emerald-600 pr-3">
              الخطبة الأولى
            </h3>
            <div className={`${fontClasses[fontSize]} text-stone-800 whitespace-pre-line text-justify`}>
              {firstKhutbah}
            </div>
          </section>

          {/* Pause Advice Box */}
          <div className="my-6 p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-center text-stone-700 font-sans text-sm italic font-medium">
            {pauseAdvice || '(جلسة الاستراحة يسيراً بين الخطبتين)'}
          </div>

          {/* Second Khutbah */}
          <section className="space-y-3">
            <h3 className="font-cairo font-bold text-lg sm:text-xl text-emerald-900 border-r-4 border-emerald-600 pr-3">
              الخطبة الثانية
            </h3>
            <div className={`${fontClasses[fontSize]} text-stone-800 whitespace-pre-line text-justify`}>
              {secondKhutbah}
            </div>
          </section>

          {/* Supplication */}
          <section className="space-y-3 pb-8">
            <h3 className="font-cairo font-bold text-lg sm:text-xl text-emerald-900 border-r-4 border-emerald-600 pr-3">
              الدعاء والختام
            </h3>
            <div className={`${fontClasses[fontSize]} text-stone-800 whitespace-pre-line text-justify`}>
              {supplication}
            </div>
          </section>

          {/* Citations references */}
          {(quranCitations?.length || hadithCitations?.length) ? (
            <div className="pt-6 border-t border-stone-200 font-sans text-xs sm:text-sm space-y-4">
              <h4 className="font-cairo font-bold text-stone-800">
                الشواهد والأدلة الموثقة:
              </h4>

              {quranCitations && quranCitations.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-bold text-emerald-800">الآيات القرآنية:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {quranCitations.map((cite, i) => (
                      <div key={i} className="p-2.5 bg-stone-100 rounded-lg text-stone-700">
                        <span className="font-amiri text-stone-900 block font-bold mb-1">
                          ﴿ {cite.verse} ﴾
                        </span>
                        <span className="text-xs text-stone-500">
                          [سورة {cite.surah}{cite.ayahNumber ? `: ${cite.ayahNumber}` : ''}]
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hadithCitations && hadithCitations.length > 0 && (
                <div className="space-y-1.5 mt-3">
                  <span className="font-bold text-sky-800">الأحاديث النبوية:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {hadithCitations.map((cite, i) => (
                      <div key={i} className="p-2.5 bg-stone-100 rounded-lg text-stone-700">
                        <span className="font-amiri text-stone-900 block mb-1">
                          « {cite.hadith} »
                        </span>
                        <span className="text-xs text-stone-500">
                          تخريج: {cite.source} {cite.grade ? `(${cite.grade})` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

        </div>

        {/* Modal Bottom Fixed Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-100/90 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="text-xs text-stone-500 hidden sm:block">
            يمكنك حفظ الخطبة على جهازك كملف Word أو PDF واستخدامها على المنبر
          </div>
          <div className="flex items-center gap-2 mr-auto">
            <button
              onClick={() => onDownload(sermon, 'word', selectedPart)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>تنزيل مستند Word (.docx)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-sm font-medium transition-all"
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
