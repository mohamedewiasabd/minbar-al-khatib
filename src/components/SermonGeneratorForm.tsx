import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Upload,
  FileText,
  BookOpen,
  Layers,
  Clock,
  Feather,
  Sliders,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  ChevronDown,
  FolderTree,
  Plus,
  Tag,
  Lock,
  ShieldCheck,
  Coins
} from 'lucide-react';
import {
  GeneratorMode,
  SermonLength,
  SermonComplexity,
  SermonTone,
  SermonDialect,
  GenerateRequest,
} from '../types';
import { processUploadedFile, ProcessedFile } from '../utils/fileHelpers';
import { useAuth } from '../context/AuthContext';
import { usePoints } from '../context/PointsContext';
import { isNativeApp } from '../lib/admob';


interface SermonGeneratorFormProps {
  onGenerate: (request: GenerateRequest) => Promise<void>;
  isLoading: boolean;
  initialValues?: Partial<GenerateRequest> | null;
}

const TOPIC_SUGGESTIONS = [
  'بر الوالدين وأثره في بركة الرزق والعمر',
  'أمانة العمل والإتقان وأثرهما في نهضة الأمة',
  'حفظ اللسان وآفات الغيبة في عصر شبكات التواصل',
  'اليقين بالله وحسن الظن به عند اشتداد الأزمات',
  'نعمة الأمن والاستقرار وواجب شكر النعم',
  'تربية الأبناء وبناء الحصانة الفكرية في زمن الفتن',
  'فضل الصبر وعاقبة الصابرين في القرآن والسنة',
  'التكافل الاجتماعي وتفريج كربات المعسرين'
];

export const PRESET_CATEGORIES = [
  'العقيدة والإيمان',
  'فقه العبادات',
  'الأخلاق والمعاملات',
  'السيرة النبوية والمناسبات',
  'الرقائق والتزكية',
  'سلاسل منبرية متكاملة',
  'فقه الأسرة والمجتمع',
  'قضايا الأمة المعاصرة',
];

export const SermonGeneratorForm: React.FC<SermonGeneratorFormProps> = ({
  onGenerate,
  isLoading,
  initialValues,
}) => {
  const { isAdmin, user, openLoginModal } = useAuth();
  const { points } = usePoints();
  const isNative = isNativeApp();
  const [mode, setMode] = useState<GeneratorMode>('topic');
  const [topic, setTopic] = useState('');

  const [category, setCategory] = useState<string>('العقيدة والإيمان');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState<boolean>(false);
  const [length, setLength] = useState<SermonLength>('medium');
  const [complexity, setComplexity] = useState<SermonComplexity>('simple');
  const [tone, setTone] = useState<SermonTone>('exhortative');
  const [dialect, setDialect] = useState<SermonDialect>('msa');
  const [isSeries, setIsSeries] = useState(false);
  const [seriesPartsCount, setSeriesPartsCount] = useState<number>(3);
  const [customInstructions, setCustomInstructions] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Pre-fill form when initialValues change (e.g. when opening from regenerate)
  useEffect(() => {
    if (initialValues) {
      if (initialValues.topic !== undefined) setTopic(initialValues.topic);
      if (initialValues.category !== undefined) {
        setCategory(initialValues.category);
        if (!PRESET_CATEGORIES.includes(initialValues.category)) {
          setIsCustomCategoryMode(true);
          setCustomCategory(initialValues.category);
        }
      }
      if (initialValues.mode !== undefined) setMode(initialValues.mode);
      if (initialValues.length !== undefined) setLength(initialValues.length);
      if (initialValues.complexity !== undefined) setComplexity(initialValues.complexity);
      if (initialValues.tone !== undefined) setTone(initialValues.tone);
      if (initialValues.dialect !== undefined) setDialect(initialValues.dialect);
      if (initialValues.isSeries !== undefined) setIsSeries(initialValues.isSeries);
      if (initialValues.seriesPartsCount !== undefined) setSeriesPartsCount(initialValues.seriesPartsCount);
      if (initialValues.customInstructions !== undefined) setCustomInstructions(initialValues.customInstructions);
    }
  }, [initialValues]);

  // File Upload State
  const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleSelectedFile(file);
  };

  const handleSelectedFile = async (file: File) => {
    setFileError(null);
    setIsProcessingFile(true);
    try {
      const res = await processUploadedFile(file);
      setProcessedFile(res);
      // Auto fill topic if empty
      if (!topic) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        setTopic(cleanName);
      }
    } catch (err: any) {
      setFileError(err?.message || 'تعذر معالجة هذا الملف');
      setProcessedFile(null);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Require login (points system deducts points in App.handleGenerate for non-admins)
    if (!user) {
      openLoginModal('لتوليد خطب وسلاسل جديدة بالنقاط، يرجى تسجيل الدخول بحساب Google.');
      return;
    }

    if (mode === 'topic' && !topic.trim()) {
      setFormError('يرجى كتابة عنوان أو موضوع الخطبة للمتابعة');
      return;
    }
    if ((mode === 'document' || (mode === 'book_series' && processedFile)) && !processedFile && !topic.trim()) {
      setFormError('يرجى اختيار ملف أو كتاب، أو كتابة عنوان الموضوع');
      return;
    }

    const effectiveCategory = isCustomCategoryMode && customCategory.trim()
      ? customCategory.trim()
      : (isSeries || mode === 'book_series' ? (category === 'العقيدة والإيمان' ? 'سلاسل منبرية متكاملة' : category) : category);

    const request: GenerateRequest = {
      mode,
      topic: topic.trim(),
      category: effectiveCategory,
      dialect,
      length,
      complexity,
      tone,
      isSeries: mode === 'book_series' ? true : isSeries,
      seriesPartsCount: mode === 'book_series' ? seriesPartsCount : (isSeries ? seriesPartsCount : undefined),
      customInstructions: customInstructions.trim(),
      fileName: processedFile?.name,
      fileText: processedFile?.text,
      fileBase64: processedFile?.base64,
      fileMimeType: processedFile?.mimeType,
    };

    await onGenerate(request);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/60 border border-stone-200 overflow-hidden">
      
      {/* Points / Login Notice Banner for Visitors & Standard Users */}
      {!isAdmin && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 p-4 sm:p-5 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
              {user ? <Coins className="w-5 h-5 text-amber-700" /> : <Lock className="w-5 h-5 text-amber-700" />}
            </div>
            <div>
              <div className="font-cairo font-bold text-sm sm:text-base text-amber-950">
                {user ? 'توليد الخطب بالنقاط' : 'سجّل دخولك لتوليد الخطب بالنقاط'}
              </div>
              <p className="text-xs text-amber-800 leading-relaxed max-w-2xl mt-0.5">
                {user
                  ? `رصيدك ${points} نقطة. خطبة مفردة بـ 1 نقطة وسلسلة بـ 5 نقاط، لذا ${isNative ? 'شاهد الإعلانات بكسب النقاط' : 'يمكنك كسب النقاط من جهاز الموبايل بشاهد الإعلانات'} وابدأ التوليد الآن. توليد المسؤول مجاني.`
                  : 'يمكنك تصفح وقراءة كافة الخطب والسلاسل وتنزيلها بصيغ Word و PDF وطباعتها مجاناً. لتوليد خطبة أو سلسلة جديدة سجّل دخولك بحساب Google واربح النقاط بمشاهدة الإعلانات.'}
              </p>
            </div>
          </div>
          {!user && (
            <button
              type="button"
              onClick={() => openLoginModal('تسجيل دخول بجوجل لبدء تجميع النقاط وتوليد الخطب والسلاسل.')}
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-bold font-cairo shadow-sm transition-all cursor-pointer shrink-0"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>دخول بحساب Google</span>
            </button>
          )}
        </div>
      )}

      {/* Mode Selector Tabs */}

      <div className="grid grid-cols-3 bg-stone-100/90 border-b border-stone-200 p-1 sm:p-1.5 gap-1 text-[11px] sm:text-sm font-semibold text-stone-600">
        <button
          type="button"
          onClick={() => {
            setMode('topic');
            setIsSeries(false);
            setFormError(null);
          }}
          className={`py-2.5 sm:py-3 px-1 sm:px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center min-h-[44px] ${
            mode === 'topic'
              ? 'bg-white text-emerald-800 shadow-sm border border-stone-200/80 font-bold'
              : 'hover:bg-white/60 hover:text-stone-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
          <span>موضوع حر</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('document');
            setIsSeries(false);
            setFormError(null);
          }}
          className={`py-2.5 sm:py-3 px-1 sm:px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center min-h-[44px] ${
            mode === 'document'
              ? 'bg-white text-emerald-800 shadow-sm border border-stone-200/80 font-bold'
              : 'hover:bg-white/60 hover:text-stone-900'
          }`}
        >
          <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
          <span>ملف ومستند</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('book_series');
            setIsSeries(true);
            setFormError(null);
          }}
          className={`py-2.5 sm:py-3 px-1 sm:px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center min-h-[44px] ${
            mode === 'book_series'
              ? 'bg-white text-emerald-800 shadow-sm border border-stone-200/80 font-bold'
              : 'hover:bg-white/60 hover:text-stone-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
          <span>سلسلة خطب</span>
        </button>
      </div>

      {formError && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-5 sm:space-y-6">
        
        {/* Mode 1 & Shared: Topic Title Input */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-stone-800">
            {mode === 'book_series'
              ? 'عنوان الكتاب أو موضوع السلسلة الخطبية:'
              : mode === 'document'
              ? 'عنوان الخطبة (أو اتركه ليعتمد على اسم الملف):'
              : 'موضوع الخطبة أو عنوانها:'}
          </label>
          <div className="relative">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                mode === 'book_series'
                  ? 'مثال: شرح كتاب الأربعين النووية، أو سيرة الخلفاء الراشدين...'
                  : mode === 'document'
                  ? 'مثال: مستخلص مقال في فضل الاستغفار'
                  : 'اكتب أي فكرة، قضية، أو آية تريد بناء خطبة متكاملة حولها...'
              }
              className="w-full px-4 py-3.5 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-stone-900 placeholder:text-stone-400 bg-stone-50/50 text-base font-medium transition-all"
            />
          </div>

          {/* Suggestion Chips (Topic Mode) */}
          {mode === 'topic' && (
            <div className="pt-2">
              <span className="text-xs text-stone-500 font-medium block mb-2">
                موضوعات مقترحة سريعة:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TOPIC_SUGGESTIONS.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTopic(sug)}
                    className="text-xs bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 px-2.5 py-1.5 rounded-lg border border-stone-200 transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mode 2 & 3: File Upload Zone */}
        {(mode === 'document' || mode === 'book_series') && (
          <div className="space-y-3">
            <label className="block text-sm font-bold text-stone-800">
              {mode === 'book_series' ? 'رفع ملف الكتاب أو المادة العلمية (اختياري إذا كتبت الموضوع أعلاه):' : 'رفع الملف المراد استخلاص الخطبة منه (PDF, DOCX, TXT, MD, HTML):'}
            </label>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                processedFile
                  ? 'border-emerald-400 bg-emerald-50/40'
                  : 'border-stone-300 hover:border-emerald-500 hover:bg-stone-50/80 bg-stone-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md,.html,.htm"
                onChange={handleFileChange}
                className="hidden"
              />

              {isProcessingFile ? (
                <div className="py-4 space-y-2">
                  <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm font-semibold text-emerald-800">جاري قراءة واستخراج محتوى الملف...</p>
                </div>
              ) : processedFile ? (
                <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-emerald-200 shadow-sm">
                  <div className="flex items-center gap-3 text-right">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold uppercase text-xs">
                      {processedFile.type}
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm truncate max-w-xs sm:max-w-md">
                        {processedFile.name}
                      </h4>
                      <p className="text-xs text-stone-500">
                        الحجم: {(processedFile.size / 1024).toFixed(1)} ك.ب
                        {processedFile.wordCount ? ` • تقريباً ${processedFile.wordCount} كلمة` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setProcessedFile(null);
                    }}
                    className="p-1.5 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="py-3 space-y-2">
                  <div className="w-12 h-12 bg-emerald-100/80 text-emerald-700 rounded-xl flex items-center justify-center mx-auto shadow-sm">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-stone-700">
                    اسحب وأفلت الملف هنا، أو <span className="text-emerald-700 underline">اضغط للاختيار</span>
                  </div>
                  <p className="text-xs text-stone-500">
                    يدعم ملفات: PDF, Word (DOCX), Markdown (MD), HTML, TXT
                  </p>
                </div>
              )}
            </div>

            {fileError && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>توجيه ذكي:</strong> يستلهم الذكاء الاصطناعي الأفكار والجوهر من الكتاب دون أي تحيز لنصوصه الحرفية، ويعيد صياغتها بروح منبرية مستقلة وبلاغة سهلة يفهمها العامي.
              </p>
            </div>
          </div>
        )}

        {/* Series Parts Selector (if Series mode or toggle is active) */}
        {(mode === 'book_series' || isSeries) && (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-700" />
                <span className="font-bold text-amber-900 text-sm">
                  إعدادات سلسلة الخطب المتسلسلة
                </span>
              </div>
              <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                {seriesPartsCount} خطب مترابطة
              </span>
            </div>
            <p className="text-xs text-amber-800/90 leading-relaxed">
              سيقوم النظام بتقسيم الموضوع أو الكتاب إلى أجزاء متتابعة تعالج كل خطبة فيها محوراً مستقلاً مع تمهيد وخاتمة وعناصر ربط مع باقي أجزاء السلسلة.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-bold text-stone-700">عدد أجزاء السلسلة:</span>
              {[2, 3, 4, 5].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setSeriesPartsCount(cnt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    seriesPartsCount === cnt
                      ? 'bg-amber-700 text-white shadow-sm'
                      : 'bg-white text-stone-700 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  {cnt} خطب
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sermon Department & Category Selection */}
        <div className="space-y-3 bg-emerald-50/40 p-4 sm:p-5 rounded-2xl border border-emerald-200/80">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-emerald-700" />
              <div>
                <label className="block text-xs sm:text-sm font-bold text-emerald-950 font-cairo">
                  القسم الشرعي وتصنيف الخطبة:
                </label>
                <p className="text-[11px] text-emerald-800/80">
                  حدد القسم الذي ستندرج تحته الخطبة في الواجهة الرئيسية، أو أضف قسماً جديداً مخصصاً
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsCustomCategoryMode(!isCustomCategoryMode);
                if (!isCustomCategoryMode && !customCategory) {
                  setCustomCategory('');
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isCustomCategoryMode
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCustomCategoryMode ? 'اختيار من الأقسام الجاهزة' : 'إضافة قسم جديد مخصص'}</span>
            </button>
          </div>

          {!isCustomCategoryMode ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {PRESET_CATEGORIES.map((catName) => {
                const isSelected = category === catName;
                return (
                  <button
                    key={catName}
                    type="button"
                    onClick={() => {
                      setCategory(catName);
                      if (catName === 'سلاسل منبرية متكاملة' && mode !== 'book_series') {
                        setIsSeries(true);
                      }
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/20 scale-[1.02]'
                        : 'bg-white text-stone-700 border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                  >
                    {catName}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2 pt-1 animate-fade-in">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="اكتب اسم القسم الجديد (مثال: فقه الأسرة والمجتمع، قضايا الشباب، مقاصد الشريعة...)"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-amber-300 bg-white text-xs sm:text-sm font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-amber-800">
                سيتم إدراج الخطبة ضمن هذا القسم المخصص وعرضه مباشرة في الواجهة الرئيسية ولوحة الإنتاج.
              </p>
            </div>
          )}
        </div>

        {/* Parameters Grid: Length, Complexity, Tone */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          
          {/* 1. Sermon Length */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>طول الخطبة وزمن الإلقاء:</span>
            </label>
            <div className="space-y-1.5">
              {[
                { id: 'short', label: 'موجزة ومركزة (مختصرة)', desc: '10 دقائق (~2000 كلمة)' },
                { id: 'medium', label: 'معتدلة نموذجية', desc: '15-18 دقيقة (~3000 كلمة)' },
                { id: 'long', label: 'مفصلة وموسعة', desc: '20-25 دقيقة (~4000 كلمة)' },
              ].map((item) => (
                <label
                  key={item.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    length === item.id
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="sermon-length"
                    value={item.id}
                    checked={length === item.id}
                    onChange={() => setLength(item.id as SermonLength)}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div>{item.label}</div>
                    <div className="text-[11px] text-stone-500 font-normal">{item.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 2. Language Complexity */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
              <Feather className="w-4 h-4 text-emerald-600" />
              <span>مستوى البلاغة واللغة:</span>
            </label>
            <div className="space-y-1.5">
              {[
                { 
                  id: 'simple', 
                  label: 'السهل الممتنع البليغ (موصى به)', 
                  desc: 'لغة سهلة واضحة يفهمها العامي وبلاغتها تضاهي الفصحى دون تكلف أو غرابة' 
                },
                { 
                  id: 'moderate', 
                  label: 'فصيح منبري متوازن', 
                  desc: 'سبك بيّن يجمع بين الجزالة وسلاسة الفهم لعموم المصلين' 
                },
                { 
                  id: 'eloquent', 
                  label: 'بلاغي رفيع ومؤثر', 
                  desc: 'استعارات منبرية بليغة وعاطفة تهز الوجدان بلغة عربية جلية' 
                },
              ].map((item) => (
                <label
                  key={item.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    complexity === item.id
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="sermon-complexity"
                    value={item.id}
                    checked={complexity === item.id}
                    onChange={() => setComplexity(item.id as SermonComplexity)}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div>{item.label}</div>
                    <div className="text-[11px] text-stone-500 font-normal">{item.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 3. Tone */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>أسلوب ونبرة الخطبة:</span>
            </label>
            <div className="space-y-1.5">
              {[
                { id: 'exhortative', label: 'وعظي ترقيقي', desc: 'تليين القلوب وتذكير بالآخرة والتوبة' },
                { id: 'guidance', label: 'توجيهي إصلاحي', desc: 'معالجة قضايا المجتمع والحلول العملية' },
                { id: 'foundational', label: 'علمي تأصيلي', desc: 'العقيدة والفقه بالأدلة المنضبطة' },
                { id: 'inspirational', label: 'حماسي شاحذ للهمم', desc: 'بث الأمل والعزة والعمل الصالح' },
              ].map((item) => (
                <label
                  key={item.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    tone === item.id
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="sermon-tone"
                    value={item.id}
                    checked={tone === item.id}
                    onChange={() => setTone(item.id as SermonTone)}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div>{item.label}</div>
                    <div className="text-[11px] text-stone-500 font-normal">{item.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* Dialect Selector */}
        <div className="space-y-2 bg-sky-50/40 p-4 sm:p-5 rounded-2xl border border-sky-200/80">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-sky-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            <div>
              <label className="block text-xs sm:text-sm font-bold text-sky-950 font-cairo">
                اللهجة الإقليمية:
              </label>
              <p className="text-[11px] text-sky-800/80">
                حدد اللهجة التي تناسب جمهور المصلين؛ يتم تكييف أسلوب الخطبة ووضوح المعاني حسب اللهجة المختارة
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'msa', label: 'فصحى عصرية', desc: 'جميع الأقطار', flag: '🌍' },
              { id: 'egyptian', label: 'فصحى (مصر)', desc: 'يفهمها المصريون', flag: '🇪🇬' },
              { id: 'levantine', label: 'فصحى (الشام)', desc: 'سوريا ولبنان والأردن وفلسطين', flag: '🇸🇾' },
              { id: 'gulf', label: 'فصحى (الخليج)', desc: 'السعودية والإمارات والكويت', flag: '🇸🇦' },
              { id: 'iraqi', label: 'فصحى (العراق)', desc: 'يفهمها العراقيون', flag: '🇮🇶' },
              { id: 'maghreb', label: 'فصحى (المغرب)', desc: 'المغرب والجزائر وتونس', flag: '🇲🇦' },
              { id: 'yemeni', label: 'فصحى (اليمن)', desc: 'يفهمها اليمنيون', flag: '🇾🇪' },
              { id: 'sudanese', label: 'فصحى (السودان)', desc: 'يفهمها السودانيون', flag: '🇸🇩' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDialect(item.id as SermonDialect)}
                className={`p-2.5 rounded-xl text-center transition-all cursor-pointer border ${
                  dialect === item.id
                    ? 'border-sky-600 bg-sky-100 shadow-md shadow-sky-900/10 scale-[1.02]'
                    : 'border-stone-200 bg-white hover:border-sky-300 hover:bg-sky-50/50'
                }`}
              >
                <div className="text-lg mb-0.5">{item.flag}</div>
                <div className={`text-[11px] font-bold ${dialect === item.id ? 'text-sky-900' : 'text-stone-800'}`}>
                  {item.label}
                </div>
                <div className="text-[10px] text-stone-500 font-normal leading-tight mt-0.5">
                  {item.desc}
                </div>
              </button>
            ))}
          </div>
          <div className="bg-sky-100/60 border border-sky-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-sky-900 mt-2">
            <svg className="w-4 h-4 text-sky-700 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <p className="leading-relaxed">
              <strong>ملاحظة:</strong> يتم تكييف الأسلوب والتبسيط حسب اللهجة المختارة مع الحفاظ على الفصحى الواضحة؛ لا يتم استخدام ألفاظ عامية في الخطبة، بل تُصاغ بالفصحى الميسرة القريبة من أسلوب الخطابة المألوف في كل بلد.
            </p>
          </div>
        </div>

        {/* Toggle Series (In Topic or Document Mode) */}
        {mode !== 'book_series' && (
          <div className="pt-1 flex items-center justify-between bg-stone-50 p-3 rounded-xl border border-stone-200">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-stone-600" />
              <span className="text-xs sm:text-sm font-bold text-stone-800">
                تحويل هذا الموضوع إلى سلسلة خطب متتابعة (عدة أجزاء):
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isSeries}
                onChange={(e) => setIsSeries(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        )}

        {/* Custom Preacher Instructions */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-bold text-stone-700">
            توجيهات إضافية خاصة للخطبة (اختياري):
          </label>
          <textarea
            rows={2}
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="مثال: تضمين وصية للمقبلين على الامتحانات، أو التركيز على قصة من السيرة، أو الاستشهاد بحديث معين..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 bg-stone-50/50"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || isProcessingFile}
            className={`w-full py-4 px-6 rounded-xl font-cairo font-bold text-base sm:text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${
              isLoading
                ? 'bg-stone-400 text-stone-100 cursor-not-allowed'
                : isAdmin
                ? 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 text-white hover:shadow-emerald-900/30 hover:scale-[1.005] active:scale-[0.995] cursor-pointer'
                : 'bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-white hover:shadow-amber-900/30 hover:scale-[1.005] active:scale-[0.995] cursor-pointer'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>جاري صياغة الخطبة بالأسلوب البلاغي المتقن...</span>
              </>
            ) : isAdmin ? (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>
                  {mode === 'book_series' || isSeries
                    ? `توليد سلسلة الخطب المنبرية (مجاني للمسؤول)`
                    : 'توليد خطبة الجمعة (مجاني للمسؤول)'}
                </span>
              </>
            ) : (
              <>
                <Coins className="w-5 h-5 text-amber-200" />
                <span>
                  {mode === 'book_series' || isSeries
                    ? `توليد سلسلة الخطب (بتكلفة 5 نقاط)`
                    : 'توليد خطبة الجمعة (بتكلفة 1 نقطة)'}
                </span>
              </>
            )}
          </button>
        </div>


      </form>
    </div>
  );
};
