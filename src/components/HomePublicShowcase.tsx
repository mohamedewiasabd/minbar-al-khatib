import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  BookOpen,
  Download,
  Eye,
  Clock,
  FileText,
  Sparkles,
  Layers,
  ChevronDown,
  Printer,
  Compass,
  PlusCircle,
  Tag,
  Mic,
  Share2,
  Check,
  TrendingUp,
  Bookmark,
  CheckCircle2,
  HeartHandshake,
  ShieldCheck,
  Scale,
  Calendar,
  Sparkle,
  Flame,
  ArrowDown,
  RotateCw,
  Edit3,
  Trash2,
  Lock
} from 'lucide-react';
import { Sermon, SeriesPart } from '../types';
import { useAuth } from '../context/AuthContext';
import { AdSlot } from './AdSlot';
import { sermonCount, totalSermonCount } from '../utils/sermonStats';


interface HomePublicShowcaseProps {
  sermons: Sermon[];
  onReadSermon: (sermon: Sermon, part?: SeriesPart | null) => void;
  onDownloadSermon: (sermon: Sermon, format: 'word' | 'txt' | 'print', part?: SeriesPart | null) => void;
  onOpenTeleprompter: (sermon: Sermon) => void;
  onGoToGenerator: () => void;
  onEditSermon?: (sermon: Sermon) => void;
  onRegenerateSermon?: (sermon: Sermon) => void;
  onDeleteSermon?: (id: string) => void;
}

// Defining categories metadata with icons, descriptions, and colors
export const CATEGORY_DEFINITIONS: {
  id: string;
  name: string;
  shortDesc: string;
  description: string;
  iconName: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
}[] = [
  {
    id: 'العقيدة والإيمان',
    name: 'قسم العقيدة والإيمان',
    shortDesc: 'ركائز التوحيد وأسماء الله الحسنى واليقين',
    description: 'خطب تأسيسية في أصول التوحيد، الإيمان باليوم الآخر، حسن الظن بالله، والتثبيت في زمن الفتن.',
    iconName: 'ShieldCheck',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    borderColor: 'border-emerald-500',
  },
  {
    id: 'فقه العبادات',
    name: 'قسم فقه العبادات',
    shortDesc: 'أحكام الصلاة والزكاة والصيام والطهارة والحج',
    description: 'خطب عملية مبسطة تجمع بين فقه الدليل وحِكَم التشريع في إقامة الفرائض وتعظيم شعائر الله.',
    iconName: 'Scale',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    borderColor: 'border-sky-500',
  },
  {
    id: 'الأخلاق والمعاملات',
    name: 'قسم الأخلاق والمعاملات',
    shortDesc: 'الصدق والأمانة وبر الوالدين وحسن الخلق',
    description: 'خطب تعالج السلوكيات المجتمعية، آداب البيوع والوفاء بالعهود، صلة الأرحام، وتربية الأبناء.',
    iconName: 'HeartHandshake',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    borderColor: 'border-amber-500',
  },
  {
    id: 'السيرة النبوية والمناسبات',
    name: 'قسم السيرة النبوية والمناسبات',
    shortDesc: 'دروس الهجرة ورمضان والأعياد والمواسم الفاضلة',
    description: 'إضاءات من حياة المصطفى ﷺ، استقبال مواسم الطاعات، وفقه المناسبات الدينية بوعي منبري متجدد.',
    iconName: 'Calendar',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-800',
    borderColor: 'border-teal-500',
  },
  {
    id: 'الرقائق والتزكية',
    name: 'قسم الرقائق والتزكية',
    shortDesc: 'التوبة ومحاسبة النفس والزهد وخشوع القلوب',
    description: 'مواعظ مؤثرة تلامس الوجدان، وتوقظ الغفلة، وتحث على الاستغفار، وتهذيب النفوس لسلامة الصدر.',
    iconName: 'Sparkle',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    borderColor: 'border-rose-500',
  },
  {
    id: 'سلاسل منبرية متكاملة',
    name: 'قسم السلاسل المنبرية المتكاملة',
    shortDesc: 'سلاسل متعددة الأسابيع تعالج كتباً وموضوعات شاملة',
    description: 'خطب منهجية مترابطة تُلقى على عدة جُمع متتالية، تتيح للخطيب بناء برنامج دعوي أسبوعي منظم.',
    iconName: 'Layers',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    borderColor: 'border-purple-500',
  },
];

export const HomePublicShowcase: React.FC<HomePublicShowcaseProps> = ({
  sermons,
  onReadSermon,
  onDownloadSermon,
  onOpenTeleprompter,
  onGoToGenerator,
  onEditSermon,
  onRegenerateSermon,
  onDeleteSermon,
}) => {
  const { isAdmin, user, openLoginModal } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionFilter, setActiveSectionFilter] = useState<string>('الكل');
  const [sortBy, setSortBy] = useState<'downloads' | 'views' | 'newest' | 'duration'>('downloads');
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState<string | null>(null);


  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Helper to scroll smoothly to a category section
  const scrollToSection = (catId: string) => {
    setActiveSectionFilter(catId);
    if (catId === 'الكل') {
      window.scrollTo({ top: 380, behavior: 'smooth' });
      return;
    }
    const el = sectionRefs.current[catId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Render Icon dynamically
  const renderCategoryIcon = (iconName: string, className: string = 'w-5 h-5') => {
    switch (iconName) {
      case 'ShieldCheck':
        return <ShieldCheck className={className} />;
      case 'Scale':
        return <Scale className={className} />;
      case 'HeartHandshake':
        return <HeartHandshake className={className} />;
      case 'Calendar':
        return <Calendar className={className} />;
      case 'Sparkle':
        return <Sparkles className={className} />;
      case 'Layers':
        return <Layers className={className} />;
      default:
        return <BookOpen className={className} />;
    }
  };

  // Dynamic list of categories combining predefined categories with any custom user-added categories
  const allCategoryDefinitions = useMemo(() => {
    const list = [...CATEGORY_DEFINITIONS];
    const knownIds = new Set(list.map((d) => d.id));

    sermons.forEach((s) => {
      const cat = s.category?.trim();
      if (cat && !knownIds.has(cat) && cat !== 'سلاسل منبرية متكاملة') {
        knownIds.add(cat);
        list.push({
          id: cat,
          name: `قسم ${cat}`,
          shortDesc: `خطب منبرية في ${cat}`,
          description: `خطب ودروس منبرية مصنفة ضمن قسم ${cat}.`,
          iconName: 'Sparkle',
          badgeBg: 'bg-emerald-100',
          badgeText: 'text-emerald-900',
          borderColor: 'border-emerald-600',
        });
      }
    });

    return list;
  }, [sermons]);

  // Group sermons by category with search and sort applied
  const categorizedData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return allCategoryDefinitions.map((def) => {
      let items = sermons.filter((s) => {
        if (def.id === 'سلاسل منبرية متكاملة') {
          return s.isSeries;
        }
        return s.category === def.id;
      });

      // Filter by search query
      if (query) {
        items = items.filter((s) => {
          const matchTitle = s.title?.toLowerCase().includes(query);
          const matchTopic = s.topic?.toLowerCase().includes(query);
          const matchCategory = s.category?.toLowerCase().includes(query);
          const matchTags = s.tags?.some((t) => t.toLowerCase().includes(query));
          const matchPoints = s.mainPoints?.some((p) => p.toLowerCase().includes(query));
          return matchTitle || matchTopic || matchCategory || matchTags || matchPoints;
        });
      }

      // Sort items
      items.sort((a, b) => {
        if (sortBy === 'downloads') {
          return (b.downloadsCount || 0) - (a.downloadsCount || 0);
        }
        if (sortBy === 'views') {
          return (b.viewsCount || 0) - (a.viewsCount || 0);
        }
        if (sortBy === 'duration') {
          return (b.estimatedMinutes || 15) - (a.estimatedMinutes || 15);
        }
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

      return {
        ...def,
        sermons: items,
        totalInSermons: sermons
          .filter((s) => (def.id === 'سلاسل منبرية متكاملة' ? s.isSeries : s.category === def.id))
          .reduce((acc, s) => acc + sermonCount(s), 0),
      };
    });
  }, [sermons, searchQuery, sortBy]);

  // Total Public Metrics (each series part counts as a separate sermon)
  const totalStats = useMemo(() => {
    const totalDownloads = sermons.reduce((acc, s) => acc + (s.downloadsCount || 0), 0);
    const totalViews = sermons.reduce((acc, s) => acc + (s.viewsCount || 0), 0);
    const totalSeries = sermons.filter((s) => s.isSeries).length;
    return { totalDownloads, totalViews, count: totalSermonCount(sermons), totalSeries };
  }, [sermons]);

  // Filter sections if a single section is isolated
  const visibleCategories = useMemo(() => {
    if (activeSectionFilter === 'الكل') {
      return categorizedData;
    }
    return categorizedData.filter((c) => c.id === activeSectionFilter);
  }, [categorizedData, activeSectionFilter]);

  const totalMatchingSermons = useMemo(() => {
    return visibleCategories.reduce(
      (acc, curr) => acc + curr.sermons.reduce((a, s) => a + sermonCount(s), 0),
      0
    );
  }, [visibleCategories]);

  return (
    <div className="space-y-12 animate-fade-in" dir="rtl">
      
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-[#0e271e] text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-stone-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 right-10 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>مستودع الخطب المنبرية المعتمدة • مرتبة حسب الأقسام الشرعية</span>
          </div>

          <h1 className="font-cairo font-extrabold text-2xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-snug">
            خُطبُ الجُمُعَةِ الجَاهِزة <span className="text-emerald-400">مُصَنَّفَةً فِي أَقسَامِهَا</span>
          </h1>

          <p className="mt-3 text-stone-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            تصفح الخطب والسلاسل المنبرية الجاهزة حسب كل قسم؛ مع إمكانية القراءة الكاملة بالتشكيل والتوثيق قبل التحميل الفوري بصيغة Word و PDF والطباعة المنبرية.
          </p>

          {/* Real-time Public Stats Counter */}
          <div className="mt-6 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2 bg-stone-800/80 px-3 sm:px-4 py-2 rounded-xl border border-stone-700/70">
              <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-stone-300">الخطب:</span>
              <strong className="text-white font-cairo font-bold text-sm sm:text-base mr-auto sm:mr-0">{totalStats.count}</strong>
            </div>

            <div className="flex items-center gap-2 bg-stone-800/80 px-3 sm:px-4 py-2 rounded-xl border border-stone-700/70">
              <Layers className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="text-stone-300">السلاسل:</span>
              <strong className="text-purple-300 font-cairo font-bold text-sm sm:text-base mr-auto sm:mr-0">{totalStats.totalSeries}</strong>
            </div>

            <div className="flex items-center gap-2 bg-stone-800/80 px-3 sm:px-4 py-2 rounded-xl border border-stone-700/70">
              <Download className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-stone-300">التنزيلات:</span>
              <strong className="text-amber-300 font-cairo font-bold text-sm sm:text-base mr-auto sm:mr-0">{totalStats.totalDownloads}</strong>
            </div>

            <div className="flex items-center gap-2 bg-stone-800/80 px-3 sm:px-4 py-2 rounded-xl border border-stone-700/70">
              <Eye className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-stone-300">القراءات:</span>
              <strong className="text-sky-300 font-cairo font-bold text-sm sm:text-base mr-auto sm:mr-0">{totalStats.totalViews}</strong>
            </div>

            <button
              onClick={() => {
                if (!user) {
                  openLoginModal('لتوليد خطبة مخصصة بالنقاط، يرجى تسجيل الدخول بحساب Google.');
                } else {
                  onGoToGenerator();
                }
              }}
              className="col-span-2 sm:mr-auto inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-cairo font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/50 transition-all cursor-pointer min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4 text-amber-200" />
              <span>صياغة خطبة مخصصة</span>
              {!user && (
                <span className="bg-emerald-800/90 text-amber-300 text-[10px] px-1.5 py-0.5 rounded-md border border-emerald-500/40">
                  سجّل دخولك
                </span>
              )}
            </button>

          </div>
        </div>
      </div>

      {/* Categories Fast Jump Nav (أقسام الخطب) */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <h2 className="font-cairo font-bold text-base sm:text-lg text-stone-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span>أقسام الخطب المنبرية الرئيسية</span>
            </h2>
            <p className="text-xs text-stone-500">اختر قسماً للانتقال المباشر إليه أو استعرض جميع الأقسام أدناه</p>
          </div>

          {/* Quick jump to all button */}
          <button
            onClick={() => scrollToSection('الكل')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSectionFilter === 'الكل'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            عرض كافة الأقسام ({totalStats.count})
          </button>
        </div>

        {/* Categories Pills / Quick Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {allCategoryDefinitions.map((def) => {
            const count = sermons
              .filter((s) => (def.id === 'سلاسل منبرية متكاملة' ? s.isSeries : s.category === def.id))
              .reduce((acc, s) => acc + sermonCount(s), 0);
            const isActive = activeSectionFilter === def.id;

            return (
              <button
                key={def.id}
                onClick={() => scrollToSection(def.id)}
                className={`flex flex-col text-right p-3 rounded-2xl border transition-all text-xs cursor-pointer group ${
                  isActive
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-stone-200 bg-stone-50/50 hover:bg-white hover:border-stone-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className={`p-1.5 rounded-xl ${def.badgeBg} ${def.badgeText}`}>
                    {renderCategoryIcon(def.iconName, 'w-4 h-4')}
                  </span>
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-white border border-stone-200 text-stone-700">
                    {count}
                  </span>
                </div>
                <strong className="font-cairo font-bold text-stone-900 line-clamp-1 group-hover:text-emerald-800">
                  {def.id}
                </strong>
                <span className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">
                  {def.shortDesc}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Filter, Search & Sort Control Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="ابحث في الخطب بالاسم، الآية، الحديث، أو المحور..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all text-stone-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
            >
              مسح
            </button>
          )}
        </div>

        {/* Section Filter and Sort by Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end text-xs sm:text-sm">
          
          {/* Active section indicator */}
          {activeSectionFilter !== 'الكل' && (
            <button
              onClick={() => setActiveSectionFilter('الكل')}
              className="px-2.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold flex items-center gap-1 hover:bg-emerald-100"
            >
              <span>القسم: {activeSectionFilter}</span>
              <span>✕</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-stone-500 font-medium whitespace-nowrap text-xs">ترتيب الخطب:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-stone-50 border border-stone-300 text-stone-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="downloads">الأكثر تنزيلاً (تحميلاً)</option>
              <option value="views">الأكثر قراءة وتصفحاً</option>
              <option value="newest">الأحدث صياغة</option>
              <option value="duration">مدة الإلقاء</option>
            </select>
          </div>

        </div>

      </div>

      {/* Main Sections Presentation (الخطب في أقسامها) */}
      <div className="space-y-14">
        
        {visibleCategories.map((category, categoryIndex) => {
          return (
            <section
              key={category.id}
              ref={(el) => (sectionRefs.current[category.id] = el)}
              className="scroll-mt-24 space-y-5"
            >
              
              {/* Category Header Card */}
              <div className={`bg-gradient-to-r from-stone-900 via-stone-900 to-stone-800 text-white rounded-2xl p-5 sm:p-6 border-r-4 ${category.borderColor} shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
                
                <div className="flex items-start gap-3.5">
                  <div className={`p-3 rounded-2xl ${category.badgeBg} ${category.badgeText} shadow-sm flex-shrink-0 mt-0.5`}>
                    {renderCategoryIcon(category.iconName, 'w-6 h-6')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="font-cairo font-extrabold text-xl sm:text-2xl text-white">
                        {category.name}
                      </h2>
                      <span className="text-xs bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-bold px-2.5 py-0.5 rounded-full">
                        {category.sermons.reduce((acc, s) => acc + sermonCount(s), 0)} خطب
                      </span>
                    </div>
                    <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                      {category.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="text-xs text-stone-400 font-medium hidden md:inline-block">
                    {category.shortDesc}
                  </span>
                  {activeSectionFilter === category.id && (
                    <button
                      onClick={() => setActiveSectionFilter('الكل')}
                      className="px-3 py-1.5 bg-stone-800 text-stone-300 hover:text-white rounded-xl text-xs font-semibold border border-stone-700"
                    >
                      عرض سائر الأقسام
                    </button>
                  )}
                </div>

              </div>

              {/* Sermons Grid for this specific Category */}
              {category.sermons.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-stone-300 text-stone-500 space-y-2">
                  <p className="text-sm font-semibold">
                    {searchQuery
                      ? `لا توجد خطب في ${category.name} تطابق البحث "${searchQuery}"`
                      : `لا توجد خطب حالياً في هذا القسم`}
                  </p>
                  <p className="text-xs text-stone-400">
                    يمكنك صياغة خطبة مخصصة فوراً وإدراجها ضمن هذا القسم بنقرة واحدة.
                  </p>
                  <button
                    onClick={onGoToGenerator}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>صياغة خطبة لهذا القسم</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.sermons.map((sermon) => (
                    <SermonCard
                      key={sermon.id}
                      sermon={sermon}
                      onRead={(part) => onReadSermon(sermon, part)}
                      onDownload={(fmt, part) => onDownloadSermon(sermon, fmt, part)}
                      onTeleprompter={() => onOpenTeleprompter(sermon)}
                      onEdit={() => onEditSermon?.(sermon)}
                      onRegenerate={() => onRegenerateSermon?.(sermon)}
                      onDelete={() => onDeleteSermon?.(sermon.id)}
                      isDropdownOpen={downloadDropdownOpen === sermon.id}
                      setDropdownOpen={(open) => setDownloadDropdownOpen(open ? sermon.id : null)}
                    />
                  ))}
                </div>
              )}

            </section>
          );
        })}

        {/* وحدات إعلانية متقدمة مدمجة مع المحتوى */}
        <AdSlot variant="inContent" slotId="home-feed-ad" />

      </div>

    </div>
  );
};

// Distinct Sermon Card Subcomponent
interface SermonCardProps {
  sermon: Sermon;
  onRead: (part?: SeriesPart | null) => void;
  onDownload: (format: 'word' | 'txt' | 'print', part?: SeriesPart | null) => void;
  onTeleprompter: () => void;
  onEdit?: () => void;
  onRegenerate?: () => void;
  onDelete?: () => void;
  isDropdownOpen: boolean;
  setDropdownOpen: (open: boolean) => void;
}

const SermonCard: React.FC<SermonCardProps> = ({
  sermon,
  onRead,
  onDownload,
  onTeleprompter,
  onEdit,
  onRegenerate,
  onDelete,
  isDropdownOpen,
  setDropdownOpen,
}) => {
  const { isAdmin, user, openLoginModal } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [partsExpanded, setPartsExpanded] = useState(false);

  const seriesParts = sermon.isSeries && sermon.seriesParts ? sermon.seriesParts : null;

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between overflow-hidden group">
      
      {/* Top Banner & Tag Info */}
      <div className="p-5 pb-3">
        
        <div className="flex items-center justify-between gap-2 mb-3">
          
          {/* Series Badge or Single Khutbah Badge */}
          {sermon.isSeries ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">
              <Layers className="w-3.5 h-3.5" />
              <span>سلسلة منبرية ({sermon.seriesParts?.length || sermon.totalSeriesParts || 3} أجزاء)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>خطبة جمعة</span>
            </span>
          )}

          {/* Time & Words */}
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-stone-400" />
              <span>{sermon.estimatedMinutes || 15} د</span>
            </span>
            <span>•</span>
            <span>{sermon.wordCount || 850} كلمة</span>
          </div>

        </div>

        {/* Sermon Title */}
        <h3
          onClick={() => onRead()}
          className="font-cairo font-bold text-lg text-stone-900 group-hover:text-emerald-700 transition-colors leading-snug cursor-pointer line-clamp-2"
        >
          {sermon.title}
        </h3>

        {/* Topic / Summary excerpt */}
        <p className="mt-2 text-xs text-stone-600 leading-relaxed line-clamp-2">
          {sermon.topic || sermon.pauseAdvice || 'خطبة نموذجية محررة بالاستدلال القرآني والنبوي والأثر الصالح.'}
        </p>

        {/* Main Points / Themes Chips */}
        {sermon.mainPoints && sermon.mainPoints.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {sermon.mainPoints.slice(0, 2).map((point, i) => (
              <span
                key={i}
                className="text-[11px] bg-stone-50 text-stone-600 px-2 py-0.5 rounded-lg border border-stone-200/80 line-clamp-1 max-w-[220px]"
              >
                {point}
              </span>
            ))}
            {sermon.mainPoints.length > 2 && (
              <span className="text-[10px] text-stone-400 self-center">
                +{sermon.mainPoints.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Series Parts Browser (all parts accessible right from the card) */}
        {seriesParts && seriesParts.length > 1 && (
          <div className="mt-3 border-t border-purple-100 pt-2.5">
            <button
              type="button"
              onClick={() => setPartsExpanded((v) => !v)}
              className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-purple-50/70 hover:bg-purple-100 text-purple-800 text-xs font-bold transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>أجزاء السلسلة ({seriesParts.length})</span>
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${partsExpanded ? 'rotate-180' : ''}`} />
            </button>

            {partsExpanded && (
              <div className="mt-2 space-y-1.5 animate-fade-in">
                {seriesParts.map((part) => (
                  <div
                    key={part.partNumber}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-stone-50 border border-stone-200/80 hover:bg-emerald-50/60 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => onRead(part)}
                      className="flex items-center gap-1.5 min-w-0 text-right text-xs font-semibold text-stone-700 hover:text-emerald-800 cursor-pointer"
                      title={`قراءة: ${part.title}`}
                    >
                      <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[10px] shrink-0">
                        الجمعة {part.partNumber}
                      </span>
                      <span className="truncate">{part.title}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDownload('word', part)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-stone-200 text-stone-600 hover:text-emerald-700 hover:border-emerald-500 text-[11px] font-bold transition-all cursor-pointer shrink-0"
                      title={`تنزيل الجزء ${part.partNumber} كملف Word`}
                    >
                      <Download className="w-3 h-3" />
                      <span>Word</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Stats Counter & Actions Footer */}
      <div className="px-5 py-3.5 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between gap-2">
        
        {/* Real-time stats counters (Views & Downloads) */}
        <div className="flex items-center gap-3 text-xs text-stone-500">
          <span className="inline-flex items-center gap-1 font-medium" title="عدد مرات القراءة">
            <Eye className="w-3.5 h-3.5 text-stone-400" />
            <span className="font-bold text-stone-700">{sermon.viewsCount || 0}</span>
          </span>

          <span className="inline-flex items-center gap-1 font-medium" title="عدد مرات التنزيل">
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-bold text-stone-700">{sermon.downloadsCount || 0}</span>
          </span>
        </div>

        {/* Action Buttons: Read Full, Download Dropdown, Teleprompter */}
        <div className="flex items-center gap-1.5">
          
          {/* Read button */}
          <button
            onClick={onRead}
            className="px-3 py-1.5 rounded-xl bg-white border border-stone-300 hover:border-emerald-600 hover:text-emerald-700 text-stone-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="قراءة الخطبة كاملة قبل التنزيل"
          >
            قراءة
          </button>

          {/* Teleprompter quick button */}
          <button
            onClick={onTeleprompter}
            className="p-1.5 rounded-xl bg-white border border-stone-300 hover:border-emerald-600 hover:text-emerald-700 text-stone-600 transition-all cursor-pointer shadow-2xs"
            title="المنبر الإلقائي الذكي (Teleprompter)"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Download dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="تنزيل الخطبة"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تنزيل</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute left-0 bottom-full mb-1.5 w-48 bg-stone-900 text-white rounded-xl shadow-xl border border-stone-700 py-1.5 z-30 text-xs font-sans">
                  
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onDownload('word');
                    }}
                    className="w-full text-right px-3.5 py-2 hover:bg-stone-800 flex items-center gap-2 text-stone-200 hover:text-white"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>تنزيل مستند وورد (Word)</span>
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onDownload('print');
                    }}
                    className="w-full text-right px-3.5 py-2 hover:bg-stone-800 flex items-center gap-2 text-stone-200 hover:text-white"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>طباعة / حفظ بتنسيق PDF</span>
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onDownload('txt');
                    }}
                    className="w-full text-right px-3.5 py-2 hover:bg-stone-800 flex items-center gap-2 text-stone-200 hover:text-white"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تنزيل ملف نصي (TXT)</span>
                  </button>

                  <div className="border-t border-stone-800 my-1"></div>

                  {onRegenerate && (
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        if (!user) {
                          openLoginModal('لإعادة صياغة الخطبة بالنقاط، يرجى تسجيل الدخول بحساب Google.');
                        } else {
                          onRegenerate();
                        }
                      }}
                      className="w-full text-right px-3.5 py-2 hover:bg-emerald-950/80 flex items-center justify-between gap-2 text-emerald-300 hover:text-emerald-100"
                    >
                      <div className="flex items-center gap-2">
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>إعادة صياغة بالذكاء الاصطناعي</span>
                      </div>
                      {!user && <Lock className="w-3 h-3 text-stone-400" />}
                    </button>
                  )}

                  {onEdit && (
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        if (!isAdmin) {
                          openLoginModal('تعديل نصوص الخطبة وأقسامها مخصص لمسؤول المنبر (Admin) فقط.');
                        } else {
                          onEdit();
                        }
                      }}
                      className="w-full text-right px-3.5 py-2 hover:bg-amber-950/80 flex items-center justify-between gap-2 text-amber-300 hover:text-amber-100"
                    >
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تعديل نصوص الخطبة</span>
                      </div>
                      {!isAdmin && <Lock className="w-3 h-3 text-stone-400" />}
                    </button>
                  )}

                  {onDelete && (
                    confirmDelete ? (
                      <div className="px-3.5 py-2 bg-red-950/90 flex items-center justify-between gap-2 border-t border-red-900/50">
                        <span className="text-red-300 text-[11px] font-bold">حذف نهائي؟</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              setConfirmDelete(false);
                              onDelete();
                            }}
                            className="bg-red-600 hover:bg-red-500 text-white px-2 py-0.5 rounded text-[11px] font-bold"
                          >
                            تأكيد
                          </button>
                          <button
                            onClick={() => setConfirmDelete(false)}
                            className="text-stone-400 hover:text-white px-1.5 py-0.5 text-[11px]"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (!isAdmin) {
                            setDropdownOpen(false);
                            openLoginModal('حذف الخطب من السحابة مخصص لمسؤول المنبر (Admin) فقط.');
                          } else {
                            setConfirmDelete(true);
                          }
                        }}
                        className="w-full text-right px-3.5 py-2 hover:bg-red-950/80 flex items-center justify-between gap-2 text-red-400 hover:text-red-200"
                      >
                        <div className="flex items-center gap-2">
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف الخطبة من السحابة</span>
                        </div>
                        {!isAdmin && <Lock className="w-3 h-3 text-stone-400" />}
                      </button>
                    )
                  )}

                </div>
              </>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
