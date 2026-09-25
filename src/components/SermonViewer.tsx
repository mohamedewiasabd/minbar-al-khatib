import React, { useState } from 'react';
import {
  Clock,
  BookOpen,
  Quote,
  CheckCircle2,
  FileText,
  Printer,
  FileDown,
  Copy,
  Check,
  Edit3,
  Mic,
  Layers,
  Sparkles,
  Share2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FolderTree,
  RotateCw,
  Trash2,
  Lock
} from 'lucide-react';
import { Sermon, SeriesPart } from '../types';
import {
  exportAsText,
  exportAsMarkdown,
  exportAsWordDoc,
  triggerPrintWindow,
} from '../utils/exportHelpers';
import { useAuth } from '../context/AuthContext';


interface SermonViewerProps {
  sermon: Sermon;
  onEdit: (part?: SeriesPart | null) => void;
  onOpenTeleprompter: (part?: SeriesPart | null) => void;
  onSaveCloud: (sermon: Sermon) => void;
  onRegenerate?: (sermon: Sermon) => void;
  onDelete?: (id: string) => void;
}

export const SermonViewer: React.FC<SermonViewerProps> = ({
  sermon,
  onEdit,
  onOpenTeleprompter,
  onSaveCloud,
  onRegenerate,
  onDelete,
}) => {
  const { isAdmin, user, openLoginModal } = useAuth();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'first' | 'second' | 'supp' | 'sources'>('all');
  const [selectedPartIndex, setSelectedPartIndex] = useState<number>(0);
  const [confirmDelete, setConfirmDelete] = useState(false);


  const hasSeries = Boolean(sermon?.isSeries && sermon?.seriesParts && sermon.seriesParts.length > 0);
  const safePartIndex = hasSeries
    ? Math.min(Math.max(0, selectedPartIndex), (sermon.seriesParts?.length || 1) - 1)
    : 0;
  const activePart: SeriesPart | null = hasSeries ? sermon.seriesParts![safePartIndex] || null : null;

  // Active content based on series or single sermon
  const currentTitle = activePart ? `${sermon.title || 'سلسلة خطب'} - ${activePart.title || ''}` : (sermon.title || 'خطبة الجمعة');
  const intro = (activePart ? activePart.intro : sermon.intro) || '';
  const firstKhutbah = (activePart ? activePart.firstKhutbah : sermon.firstKhutbah) || '';
  const pauseAdvice = (activePart ? activePart.pauseAdvice : sermon.pauseAdvice) || '(جلسة الاستراحة يسيراً بين الخطبتين والاستغفار)';
  const secondKhutbah = (activePart ? activePart.secondKhutbah : sermon.secondKhutbah) || '';
  const supplication = (activePart ? activePart.supplication : sermon.supplication) || '';
  const mainPoints = (activePart ? activePart.mainPoints : sermon.mainPoints) || [];
  const quranCitations = (activePart ? activePart.quranCitations : sermon.quranCitations) || [];
  const hadithCitations = (activePart ? activePart.hadithCitations : sermon.hadithCitations) || [];
  const estimatedMinutes = (activePart ? activePart.estimatedMinutes : sermon.estimatedMinutes) || 15;
  const wordCount = (activePart ? activePart.wordCount : sermon.wordCount) || 0;

  const handleCopy = () => {
    const fullContent = `${currentTitle}\n\n[المقدمة]\n${intro}\n\n[الخطبة الأولى]\n${firstKhutbah}\n\n[جلسة الاستراحة]\n${pauseAdvice}\n\n[الخطبة الثانية]\n${secondKhutbah}\n\n[الدعاء والختام]\n${supplication}`;
    navigator.clipboard.writeText(fullContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getComplexityLabel = (c: string) => {
    switch (c) {
      case 'simple': return 'مبسط وعصري';
      case 'moderate': return 'فصيح متوازن';
      case 'eloquent': return 'بلاغي رصين كلاسيكي';
      default: return 'فصيح';
    }
  };

  const getToneLabel = (t: string) => {
    switch (t) {
      case 'exhortative': return 'وعظي ترقيقي';
      case 'guidance': return 'توجيهي إصلاحي';
      case 'foundational': return 'علمي تأصيلي';
      case 'inspirational': return 'حماسي شاحذ للهمم';
      default: return 'وعظي';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Actions Header */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white p-6 sm:p-8">
          
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-emerald-950/80 text-emerald-300 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 border border-emerald-700/60">
                <FolderTree className="w-3.5 h-3.5 text-emerald-400" />
                <span>القسم: {sermon.category || (sermon.isSeries ? 'سلاسل منبرية متكاملة' : 'العقيدة والإيمان')}</span>
              </span>
              <span className="bg-emerald-700/80 text-emerald-100 px-3 py-1 rounded-full font-semibold border border-emerald-500/30">
                {getComplexityLabel(sermon.complexity)}
              </span>
              <span className="bg-amber-600/70 text-amber-100 px-3 py-1 rounded-full font-semibold border border-amber-400/30">
                {getToneLabel(sermon.tone)}
              </span>
              {sermon.isSeries && (
                <span className="bg-stone-800/80 text-amber-300 px-3 py-1 rounded-full font-bold flex items-center gap-1 border border-stone-700">
                  <Layers className="w-3.5 h-3.5" />
                  <span>سلسلة خطب ({sermon.seriesParts?.length || sermon.totalSeriesParts || 3} أجزاء)</span>
                </span>
              )}
            </div>

            <div className="flex items-center flex-wrap gap-2">
              {/* Teleprompter Button */}
              <button
                type="button"
                onClick={() => onOpenTeleprompter(activePart)}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="عرض بنمط شاشة الإلقاء للمنبر"
              >
                <Mic className="w-4 h-4" />
                <span>وضع إلقاء المنبر</span>
              </button>

{/* Regenerate Button */}
              {onRegenerate && (
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      openLoginModal('لإعادة صياغة الخطبة بالنقاط، يرجى تسجيل الدخول بحساب Google.');
                    } else {
                      onRegenerate(sermon);
                    }
                  }}
                  className="flex items-center gap-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 hover:text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all border border-emerald-600/40 hover:border-emerald-400 cursor-pointer"
                  title="إعادة توليد وصياغة الخطبة بالذكاء الاصطناعي"
                >
                  <RotateCw className="w-4 h-4 text-emerald-300" />
                  <span>إعادة توليد</span>
                  {!user && <Lock className="w-3 h-3 text-stone-400" />}
                </button>
              )}

              {/* Edit Button */}
              <button
                type="button"
                onClick={() => {
                  if (!isAdmin) {
                    openLoginModal('تعديل نصوص الخطبة وأقسامها مخصص لمسؤول المنبر (Admin) فقط.');
                  } else {
                    onEdit(activePart);
                  }
                }}
                className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all border border-emerald-500/50 cursor-pointer"
                title="تعديل نصوص الخطبة يدوياً في المحرر"
              >
                <Edit3 className="w-4 h-4" />
                <span>تعديل</span>
                {!isAdmin && <Lock className="w-3 h-3 text-stone-300" />}
              </button>

              {/* Delete Button with Safety Confirmation */}
              {onDelete && (
                confirmDelete ? (
                  <div className="inline-flex items-center gap-1 bg-red-950/95 border border-red-500/70 p-1 rounded-xl text-xs shadow-lg animate-fade-in">
                    <span className="text-red-200 px-1 font-bold text-[11px]">حذف نهائي؟</span>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(sermon.id);
                        setConfirmDelete(false);
                      }}
                      className="bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer"
                    >
                      تأكيد
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="text-stone-300 hover:text-white px-2 py-1 text-xs cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!isAdmin) {
                        openLoginModal('حذف الخطب من السحابة مخصص لمسؤول المنبر (Admin) فقط.');
                      } else {
                        setConfirmDelete(true);
                      }
                    }}
                    className="flex items-center gap-1.5 bg-stone-900/60 hover:bg-red-950/90 text-stone-300 hover:text-red-200 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border border-stone-700/60 hover:border-red-500/50 cursor-pointer"
                    title="حذف هذه الخطبة من السحابة"
                  >
                    <Trash2 className="w-4 h-4 text-stone-400 hover:text-red-300" />
                    <span className="hidden sm:inline">حذف</span>
                    {!isAdmin && <Lock className="w-3 h-3 text-stone-400" />}
                  </button>
                )
              )}
            </div>
          </div>

          <h1 className="font-cairo font-bold text-2xl sm:text-3xl lg:text-4xl text-white leading-snug">
            {currentTitle}
          </h1>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 text-xs sm:text-sm text-emerald-200/80 font-medium">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-300" />
              <span>زمن الإلقاء المقدر: حوالي {estimatedMinutes} دقيقة</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-300" />
              <span>عدد الكلمات: {wordCount} كلمة</span>
            </div>
            {sermon.topic && (
              <div className="text-stone-300">
                الموضوع: {sermon.topic}
              </div>
            )}
          </div>

        </div>

        {/* Series Navigator (If Series Mode) */}
        {hasSeries && sermon.seriesParts && (
          <div className="bg-stone-50 border-b border-stone-200 px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-700" />
                <span>أجزاء السلسلة الخطبية:</span>
              </span>
              <span className="text-xs text-stone-500">
                الجزء {selectedPartIndex + 1} من {sermon.seriesParts.length}
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {sermon.seriesParts.map((part, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedPartIndex(idx)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all text-right ${
                    selectedPartIndex === idx
                      ? 'bg-emerald-700 text-white shadow-sm border border-emerald-800'
                      : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <div className="text-[10px] opacity-80">الخطبة {idx + 1}</div>
                  <div className="truncate max-w-[200px]">{part.title}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Export & Utility Toolbar */}
        <div className="bg-stone-100/70 px-6 py-3 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-stone-600 ml-1">تصدير وحفظ:</span>
            
            <button
              type="button"
              onClick={() => triggerPrintWindow(sermon, activePart)}
              className="flex items-center gap-1.5 bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 px-3 py-1.5 rounded-lg border border-stone-200 font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-600" />
              <span>طباعة / PDF</span>
            </button>

            <button
              type="button"
              onClick={() => exportAsWordDoc(sermon, activePart)}
              className="flex items-center gap-1.5 bg-white hover:bg-blue-50 text-stone-700 hover:text-blue-800 px-3 py-1.5 rounded-lg border border-stone-200 font-semibold shadow-xs transition-colors"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-600" />
              <span>Word (DOCX)</span>
            </button>

            <button
              type="button"
              onClick={() => exportAsMarkdown(sermon, activePart)}
              className="flex items-center gap-1.5 bg-white hover:bg-purple-50 text-stone-700 hover:text-purple-800 px-3 py-1.5 rounded-lg border border-stone-200 font-semibold shadow-xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              <span>Markdown</span>
            </button>

            <button
              type="button"
              onClick={() => exportAsText(sermon, activePart)}
              className="flex items-center gap-1.5 bg-white hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded-lg border border-stone-200 font-semibold shadow-xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-stone-600" />
              <span>ملف نصي (TXT)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 shadow-xs'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>تم النسخ للحافظة</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-stone-600" />
                  <span>نسخ النص كاملاً</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onSaveCloud(sermon)}
              className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-xs transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-300" />
              <span>حفظ سحابي</span>
            </button>
          </div>

        </div>

        {/* View Tabs */}
        <div className="flex border-b border-stone-200 bg-white px-6 gap-2 text-xs sm:text-sm font-bold text-stone-600 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            الخطبة الكاملة
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('first')}
            className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'first'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            الخطبة الأولى
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('second')}
            className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'second'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            الخطبة الثانية
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('supp')}
            className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'supp'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            الدعاء والختام
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sources')}
            className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'sources'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            الشواهد القرآنية والنبوية ({quranCitations?.length || 0 + (hadithCitations?.length || 0)})
          </button>
        </div>

      </div>

      {/* Main Points Extracted Banner */}
      {mainPoints && mainPoints.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/40 border border-emerald-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-emerald-700" />
            <h3 className="font-cairo font-bold text-base sm:text-lg text-emerald-950">
              أبرز محاور وعناصر الخطبة:
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {mainPoints.map((point, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 bg-white/80 p-3 rounded-xl border border-emerald-100 text-stone-800 text-xs sm:text-sm font-medium leading-relaxed"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs flex-shrink-0 font-bold mt-0.5">
                  {i + 1}
                </span>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quran & Hadith Citations Cards (Shown if 'sources' tab or summary) */}
      {activeTab === 'sources' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Quran Citations */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
              <BookOpen className="w-5 h-5 text-amber-600" />
              <h3 className="font-cairo font-bold text-base text-stone-900">
                الآيات القرآنية المستشهد بها ({quranCitations?.length || 0})
              </h3>
            </div>
            <div className="space-y-3">
              {quranCitations && quranCitations.length > 0 ? (
                quranCitations.map((q, i) => (
                  <div
                    key={i}
                    className="p-3.5 bg-amber-50/40 rounded-xl border border-amber-200/60 space-y-2"
                  >
                    <p className="font-amiri text-lg text-stone-900 leading-relaxed">
                      ﴿ {q.verse} ﴾
                    </p>
                    <div className="text-xs font-bold text-amber-800 flex items-center gap-2">
                      <span>سورة {q.surah}</span>
                      {q.ayahNumber && <span>• الآية: {q.ayahNumber}</span>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-500">تم تضمين الآيات مباشرة في سياق الخطبة.</p>
              )}
            </div>
          </div>

          {/* Hadith Citations */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
              <Quote className="w-5 h-5 text-emerald-700" />
              <h3 className="font-cairo font-bold text-base text-stone-900">
                الأحاديث النبوية وتخريجها ({hadithCitations?.length || 0})
              </h3>
            </div>
            <div className="space-y-3">
              {hadithCitations && hadithCitations.length > 0 ? (
                hadithCitations.map((h, i) => (
                  <div
                    key={i}
                    className="p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-200/60 space-y-2"
                  >
                    <p className="font-amiri text-base sm:text-lg text-stone-900 leading-relaxed">
                      « {h.hadith} »
                    </p>
                    <div className="text-xs font-bold text-emerald-800 flex items-center gap-2">
                      <span>التخريج: {h.source}</span>
                      {h.grade && <span>• الدرجة: {h.grade}</span>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-500">تم تضمين الأحاديث الشريفة في سياق الخطبة.</p>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Sermon Text Content */}
      {activeTab !== 'sources' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xl p-6 sm:p-10 lg:p-14 space-y-8">
          
          {/* Basmalah */}
          <div className="text-center py-2">
            <span className="font-amiri text-2xl sm:text-3xl text-emerald-800 font-bold tracking-wider">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </span>
          </div>

          {/* Section: Introduction & Khutbah Al-Hajah */}
          {(activeTab === 'all' || activeTab === 'first') && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <h2 className="font-cairo font-bold text-lg sm:text-xl text-emerald-900">
                  المقدمة وخطبة الحاجة وبراعة الاستهلال
                </h2>
              </div>
              <div className="font-amiri text-lg sm:text-xl leading-[2.2] text-stone-800 text-justify space-y-4 bg-stone-50/40 p-5 rounded-2xl border border-stone-100">
                {(intro || '').split('\n\n').filter(Boolean).map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}

          {/* Section: First Sermon Body */}
          {(activeTab === 'all' || activeTab === 'first') && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <h2 className="font-cairo font-bold text-lg sm:text-xl text-emerald-900">
                  صلب الخطبة الأولى (العناصر والمواعظ)
                </h2>
              </div>
              <div className="font-amiri text-lg sm:text-xl leading-[2.2] text-stone-800 text-justify space-y-4 bg-stone-50/40 p-5 rounded-2xl border border-stone-100">
                {(firstKhutbah || '').split('\n\n').filter(Boolean).map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}

          {/* Section: Intermission Pause (In 'all' tab) */}
          {activeTab === 'all' && (
            <div className="my-8 py-4 px-6 rounded-2xl bg-amber-50/80 border border-amber-200 text-center">
              <p className="font-cairo font-bold text-amber-900 text-sm sm:text-base">
                {pauseAdvice}
              </p>
            </div>
          )}

          {/* Section: Second Sermon */}
          {(activeTab === 'all' || activeTab === 'second') && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <h2 className="font-cairo font-bold text-lg sm:text-xl text-emerald-900">
                  الخطبة الثانية والوصايا التطبيقية
                </h2>
              </div>
              <div className="font-amiri text-lg sm:text-xl leading-[2.2] text-stone-800 text-justify space-y-4 bg-stone-50/40 p-5 rounded-2xl border border-stone-100">
                {(secondKhutbah || '').split('\n\n').filter(Boolean).map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}

          {/* Section: Supplication */}
          {(activeTab === 'all' || activeTab === 'supp') && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <h2 className="font-cairo font-bold text-lg sm:text-xl text-emerald-900">
                  الدعاء الجامع والختام
                </h2>
              </div>
              <div className="font-amiri text-lg sm:text-xl leading-[2.2] text-stone-800 text-justify space-y-4 bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100/80">
                {(supplication || '').split('\n\n').filter(Boolean).map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
