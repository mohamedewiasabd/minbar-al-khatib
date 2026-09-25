import React, { useState } from 'react';
import {
  Save,
  RotateCcw,
  Check,
  Quote,
  Sparkles,
  BookOpen,
  SplitSquareVertical,
  Maximize2,
  FileEdit,
  FolderTree,
  Plus,
  Lock
} from 'lucide-react';
import { Sermon, SeriesPart } from '../types';
import { useAuth } from '../context/AuthContext';


const CATEGORY_OPTIONS = [
  'العقيدة والإيمان',
  'فقه العبادات',
  'الأخلاق والمعاملات',
  'السيرة النبوية والمناسبات',
  'الرقائق والتزكية',
  'سلاسل منبرية متكاملة',
  'فقه الأسرة والمجتمع',
  'قضايا الأمة المعاصرة',
];

interface SermonEditorProps {
  sermon: Sermon;
  activePart?: SeriesPart | null;
  onSave: (updatedSermon: Sermon) => Promise<void>;
  onClose: () => void;
}

export const SermonEditor: React.FC<SermonEditorProps> = ({
  sermon,
  activePart,
  onSave,
  onClose,
}) => {
  const { isAdmin, openLoginModal } = useAuth();
  const isSeriesPart = !!activePart;


  const [title, setTitle] = useState(
    (isSeriesPart ? activePart?.title : sermon.title) || ''
  );
  const [intro, setIntro] = useState(
    (isSeriesPart ? activePart?.intro : sermon.intro) || ''
  );
  const [firstKhutbah, setFirstKhutbah] = useState(
    (isSeriesPart ? activePart?.firstKhutbah : sermon.firstKhutbah) || ''
  );
  const [pauseAdvice, setPauseAdvice] = useState(
    (isSeriesPart ? activePart?.pauseAdvice : sermon.pauseAdvice) || '(جلسة الاستراحة بين الخطبتين)'
  );
  const [secondKhutbah, setSecondKhutbah] = useState(
    (isSeriesPart ? activePart?.secondKhutbah : sermon.secondKhutbah) || ''
  );
  const [supplication, setSupplication] = useState(
    (isSeriesPart ? activePart?.supplication : sermon.supplication) || ''
  );

  const [category, setCategory] = useState<string>(sermon.category || 'العقيدة والإيمان');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState<boolean>(false);

  const [editMode, setEditMode] = useState<'sections' | 'full'>('sections');
  const [fullText, setFullText] = useState(
    (isSeriesPart
      ? activePart?.fullText
      : sermon.fullText) || `${(isSeriesPart ? activePart?.intro : sermon.intro) || ''}\n\n${(isSeriesPart ? activePart?.firstKhutbah : sermon.firstKhutbah) || ''}\n\n${(isSeriesPart ? activePart?.pauseAdvice : sermon.pauseAdvice) || '(جلسة الاستراحة بين الخطبتين)'}\n\n${(isSeriesPart ? activePart?.secondKhutbah : sermon.secondKhutbah) || ''}\n\n${(isSeriesPart ? activePart?.supplication : sermon.supplication) || ''}`
  );

  const [activeField, setActiveField] = useState<'intro' | 'first' | 'second' | 'supp' | 'full'>('first');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Quick insertion helpers
  const insertTextAtCursor = (insertion: string) => {
    if (editMode === 'full') {
      setFullText((prev) => prev + ' ' + insertion + ' ');
      return;
    }

    if (activeField === 'first') {
      setFirstKhutbah((prev) => prev + ' ' + insertion + ' ');
    } else if (activeField === 'second') {
      setSecondKhutbah((prev) => prev + ' ' + insertion + ' ');
    } else if (activeField === 'intro') {
      setIntro((prev) => prev + ' ' + insertion + ' ');
    } else if (activeField === 'supp') {
      setSupplication((prev) => prev + ' ' + insertion + ' ');
    }
  };

  const handleSave = async () => {
    if (!isAdmin) {
      openLoginModal('حفظ التعديلات على الخطب في السحابة مخصص لمسؤول المنبر (Admin) فقط.');
      return;
    }

    setIsSaving(true);
    try {

      let updatedFull = '';
      if (editMode === 'full') {
        updatedFull = fullText || '';
      } else {
        updatedFull = `${intro || ''}\n\n${firstKhutbah || ''}\n\n${pauseAdvice || ''}\n\n${secondKhutbah || ''}\n\n${supplication || ''}`;
      }

      const words = (updatedFull || '').split(/\s+/).filter(Boolean).length;
      // Based on realistic pulpit delivery (~200 words per 10 minutes -> ~200 words/min)
      const minutes = Math.max(5, Math.round(words / 200));

      const effectiveCategory = isCustomCategoryMode && customCategory.trim()
        ? customCategory.trim()
        : category;

      let updatedSermon: Sermon;

      if (isSeriesPart && sermon.seriesParts) {
        const updatedParts = sermon.seriesParts.map((p) => {
          if (p.partNumber === activePart.partNumber) {
            return {
              ...p,
              title,
              intro,
              firstKhutbah,
              pauseAdvice,
              secondKhutbah,
              supplication,
              fullText: updatedFull,
              wordCount: words,
              estimatedMinutes: minutes,
            };
          }
          return p;
        });

        updatedSermon = {
          ...sermon,
          category: effectiveCategory,
          seriesParts: updatedParts,
          updatedAt: new Date().toISOString(),
        };
      } else {
        updatedSermon = {
          ...sermon,
          category: effectiveCategory,
          title,
          intro,
          firstKhutbah,
          pauseAdvice,
          secondKhutbah,
          supplication,
          fullText: updatedFull,
          wordCount: words,
          estimatedMinutes: minutes,
          updatedAt: new Date().toISOString(),
        };
      }

      await onSave(updatedSermon);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('فشل حفظ التعديلات سحابياً');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden">
      
      {/* Editor Header Bar */}
      <div className="bg-stone-900 text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-700/60 text-emerald-300">
            <FileEdit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-cairo font-bold text-base sm:text-lg">
              محرر الخطبة اليدوي
            </h3>
            <p className="text-xs text-stone-400">
              {isSeriesPart ? `تعديل الجزء (${activePart.partNumber}): ${activePart.title}` : 'تعديل نصوص الخطبة ومحاورها وحفظها سحابياً'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="bg-stone-800 p-1 rounded-lg flex items-center text-xs font-semibold">
            <button
              type="button"
              onClick={() => setEditMode('sections')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                editMode === 'sections'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              أقسام الخطبة
            </button>
            <button
              type="button"
              onClick={() => {
                setFullText(`${intro}\n\n${firstKhutbah}\n\n${pauseAdvice}\n\n${secondKhutbah}\n\n${supplication}`);
                setEditMode('full');
              }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                editMode === 'full'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              النص الكامل المتصل
            </button>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all cursor-pointer ${
              !isAdmin
                ? 'bg-stone-800 text-amber-300 border border-amber-500/40 hover:bg-stone-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-amber-300" />
                <span>تم الحفظ السحابي</span>
              </>
            ) : isSaving ? (
              <span>جاري الحفظ...</span>
            ) : !isAdmin ? (
              <>
                <Lock className="w-4 h-4 text-amber-400" />
                <span>حفظ التعديلات (مشرف فقط)</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات</span>
              </>
            )}
          </button>


          <button
            type="button"
            onClick={onClose}
            className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-3 py-2 rounded-lg text-sm font-medium transition-all"
          >
            إنهاء التحرير
          </button>
        </div>
      </div>

      {/* Preacher Toolbar: Quick inserts */}
      <div className="bg-stone-50 border-b border-stone-200 px-4 py-2.5 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-stone-600 ml-1">إدراج سريع:</span>
        <button
          type="button"
          onClick={() => insertTextAtCursor('﴿  ﴾')}
          className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 font-bold border border-stone-200 rounded-md transition-colors"
          title="أقواس الآيات القرآنية"
        >
          ﴿ آية كريمة ﴾
        </button>
        <button
          type="button"
          onClick={() => insertTextAtCursor('«  »')}
          className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 font-bold border border-stone-200 rounded-md transition-colors"
          title="أقواس الحديث الشريف"
        >
          « حديث شريف »
        </button>
        <button
          type="button"
          onClick={() => insertTextAtCursor('أَيُّهَا الْمُؤْمِنُونَ:')}
          className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-md transition-colors"
        >
          أَيُّهَا الْمُؤْمِنُونَ:
        </button>
        <button
          type="button"
          onClick={() => insertTextAtCursor('عِبَادَ اللَّهِ:')}
          className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-md transition-colors"
        >
          عِبَادَ اللَّهِ:
        </button>
        <button
          type="button"
          onClick={() => insertTextAtCursor('مَعَاشِرَ الصَّالِحِينَ:')}
          className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-md transition-colors"
        >
          مَعَاشِرَ الصَّالِحِينَ:
        </button>
        <button
          type="button"
          onClick={() => insertTextAtCursor('فَيَا رَعَاكُمُ اللَّهُ:')}
          className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-md transition-colors"
        >
          فَيَا رَعَاكُمُ اللَّهُ:
        </button>
      </div>

      {/* Editor Body */}
      <div className="p-6 space-y-6">
        
        {/* Title Editor */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-stone-700">
            عنوان الخطبة:
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 font-bold text-stone-900 text-base"
          />
        </div>

        {/* Category / Department Editor */}
        <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-200/80 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950 font-cairo">
              <FolderTree className="w-4 h-4 text-emerald-700" />
              <span>القسم الشرعي وتصنيف الخطبة:</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsCustomCategoryMode(!isCustomCategoryMode);
                if (!isCustomCategoryMode && !customCategory) {
                  setCustomCategory('');
                }
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isCustomCategoryMode
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <Plus className="w-3 h-3" />
              <span>{isCustomCategoryMode ? 'اختيار من الأقسام' : 'إضافة قسم جديد'}</span>
            </button>
          </div>

          {!isCustomCategoryMode ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {CATEGORY_OPTIONS.map((catName) => {
                const isSelected = category === catName;
                return (
                  <button
                    key={catName}
                    type="button"
                    onClick={() => setCategory(catName)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'bg-white text-stone-700 border border-stone-200 hover:border-emerald-300'
                    }`}
                  >
                    {catName}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1 pt-1">
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="اكتب اسم القسم الجديد (مثال: فقه الأسرة، قضايا الشباب، مقاصد الشريعة...)"
                className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                autoFocus
              />
              <p className="text-[11px] text-amber-800">
                سيتم حفظ الخطبة تحت هذا القسم وتحديث تصنيفها في الواجهة الرئيسية.
              </p>
            </div>
          )}
        </div>

        {editMode === 'sections' ? (
          <div className="space-y-6">
            
            {/* Section 1: Intro */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-800">
                  1. المقدمة وخطبة الحاجة وبراعة الاستهلال:
                </label>
                <span className="text-[11px] text-stone-400">
                  {(intro || '').split(/\s+/).filter(Boolean).length} كلمة
                </span>
              </div>
              <textarea
                rows={4}
                value={intro}
                onFocus={() => setActiveField('intro')}
                onChange={(e) => setIntro(e.target.value)}
                className="w-full p-4 rounded-xl border border-stone-300 focus:border-emerald-600 font-amiri text-lg leading-loose text-stone-900 bg-stone-50/40"
              />
            </div>

            {/* Section 2: First Sermon */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-800">
                  2. صلب الخطبة الأولى (العناصر، الآيات، الأحاديث، والوعظ):
                </label>
                <span className="text-[11px] text-stone-400">
                  {(firstKhutbah || '').split(/\s+/).filter(Boolean).length} كلمة
                </span>
              </div>
              <textarea
                rows={10}
                value={firstKhutbah}
                onFocus={() => setActiveField('first')}
                onChange={(e) => setFirstKhutbah(e.target.value)}
                className="w-full p-4 rounded-xl border border-stone-300 focus:border-emerald-600 font-amiri text-lg leading-loose text-stone-900 bg-stone-50/40"
              />
            </div>

            {/* Section 3: Pause Advice */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600">
                3. جلسة الاستراحة بين الخطبتين:
              </label>
              <input
                type="text"
                value={pauseAdvice}
                onChange={(e) => setPauseAdvice(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-stone-300 focus:border-emerald-600 text-stone-700 text-sm italic bg-stone-100"
              />
            </div>

            {/* Section 4: Second Sermon */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-800">
                  4. الخطبة الثانية والوصايا العملية التطبيقية:
                </label>
                <span className="text-[11px] text-stone-400">
                  {(secondKhutbah || '').split(/\s+/).filter(Boolean).length} كلمة
                </span>
              </div>
              <textarea
                rows={6}
                value={secondKhutbah}
                onFocus={() => setActiveField('second')}
                onChange={(e) => setSecondKhutbah(e.target.value)}
                className="w-full p-4 rounded-xl border border-stone-300 focus:border-emerald-600 font-amiri text-lg leading-loose text-stone-900 bg-stone-50/40"
              />
            </div>

            {/* Section 5: Supplication */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-800">
                  5. الدعاء والختام والصلاة على النبي ﷺ:
                </label>
                <span className="text-[11px] text-stone-400">
                  {(supplication || '').split(/\s+/).filter(Boolean).length} كلمة
                </span>
              </div>
              <textarea
                rows={5}
                value={supplication}
                onFocus={() => setActiveField('supp')}
                onChange={(e) => setSupplication(e.target.value)}
                className="w-full p-4 rounded-xl border border-stone-300 focus:border-emerald-600 font-amiri text-lg leading-loose text-stone-900 bg-stone-50/40"
              />
            </div>

          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-800">
                نص الخطبة الكامل المتصل:
              </label>
              <span className="text-[11px] text-stone-400">
                {(fullText || '').split(/\s+/).filter(Boolean).length} كلمة (حوالي {Math.round((fullText || '').split(/\s+/).filter(Boolean).length / 100)} دقيقة إلقاء)
              </span>
            </div>
            <textarea
              rows={22}
              value={fullText}
              onFocus={() => setActiveField('full')}
              onChange={(e) => setFullText(e.target.value)}
              className="w-full p-5 rounded-xl border border-stone-300 focus:border-emerald-600 font-amiri text-lg leading-loose text-stone-900 bg-stone-50/40"
            />
          </div>
        )}

        {/* Footer save action */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-stone-700 hover:bg-stone-100 font-medium text-sm transition-colors"
          >
            إلغاء التغييرات
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all"
          >
            <Save className="w-4 h-4" />
            <span>حفظ واعتماد التعديلات سحابياً</span>
          </button>
        </div>

      </div>

    </div>
  );
};
