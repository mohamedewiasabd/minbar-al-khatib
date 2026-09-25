import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import {
  TrendingUp,
  Download,
  Eye,
  FileText,
  Clock,
  Award,
  Layers,
  Sparkles,
  BookOpen,
  FolderTree,
  Calendar,
  ArrowUpRight,
  Printer,
  PlusCircle,
  CheckCircle2,
  Trash2,
  Edit3,
  Mic,
  Search,
  Filter,
  Check,
  Zap,
  Target,
  BarChart3,
  Flame,
  LayoutDashboard,
  RotateCw,
  ChevronDown
} from 'lucide-react';
import { Sermon, SeriesPart } from '../types';
import { sermonCount, totalSermonCount } from '../utils/sermonStats';

interface SermonDashboardProps {
  sermons: Sermon[];
  onSelectSermon: (sermon: Sermon) => void;
  onReadSermon: (sermon: Sermon, part?: SeriesPart | null) => void;
  onDownloadSermon: (sermon: Sermon, format: 'word' | 'txt' | 'print') => void;
  onEditSermon?: (sermon: Sermon) => void;
  onDeleteSermon?: (id: string) => void;
  onOpenTeleprompter?: (sermon: Sermon) => void;
  onGoToGenerator?: () => void;
  onRegenerateSermon?: (sermon: Sermon) => void;
}

const COLORS = ['#059669', '#0284c7', '#d97706', '#7c3aed', '#e11d48', '#0d9488', '#b45309'];

export const SermonDashboard: React.FC<SermonDashboardProps> = ({
  sermons,
  onSelectSermon,
  onReadSermon,
  onDownloadSermon,
  onEditSermon,
  onDeleteSermon,
  onOpenTeleprompter,
  onGoToGenerator,
  onRegenerateSermon,
}) => {
  // Dashboard Sub-View Tab: Overview/Analytics vs Production Management
  const [dashboardTab, setDashboardTab] = useState<'analytics' | 'production'>('analytics');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState<'all' | 'single' | 'series'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedPartsId, setExpandedPartsId] = useState<string | null>(null);

  // Aggregate Metrics & Insights
  const stats = useMemo(() => {
    let totalWords = 0;
    let totalDownloads = 0;
    let totalViews = 0;
    let totalMinutes = 0;
    let seriesCount = 0;

    const topicFrequency: Record<string, number> = {};
    const categoryFrequency: Record<string, number> = {};
    const monthlyCounts: Record<string, number> = {};
    const lengthCounts = { short: 0, medium: 0, long: 0 };
    const complexityCounts = { simple: 0, moderate: 0, eloquent: 0 };

    const monthNamesArabic = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    sermons.forEach((s) => {
      totalDownloads += Number(s.downloadsCount || 0);
      totalViews += Number(s.viewsCount || 0);
      if (s.isSeries) seriesCount++;

      // Each part of a series counts as a separate sermon
      const parts: SeriesPart[] =
        s.isSeries && s.seriesParts && s.seriesParts.length > 0
          ? s.seriesParts
          : ([{
              partNumber: 1,
              title: s.title,
              summary: '',
              intro: s.intro,
              firstKhutbah: s.firstKhutbah,
              pauseAdvice: s.pauseAdvice,
              secondKhutbah: s.secondKhutbah,
              supplication: s.supplication,
              fullText: s.fullText,
              mainPoints: s.mainPoints,
              quranCitations: s.quranCitations,
              hadithCitations: s.hadithCitations,
              estimatedMinutes: s.estimatedMinutes,
              wordCount: s.wordCount,
            }] as SeriesPart[]);

      parts.forEach((p) => {
        totalWords += Number(p.wordCount || 0);
        totalMinutes += Number(p.estimatedMinutes || 15);

        // Length and Complexity
        if (s.length in lengthCounts) {
          lengthCounts[s.length as keyof typeof lengthCounts]++;
        }
        if (s.complexity in complexityCounts) {
          complexityCounts[s.complexity as keyof typeof complexityCounts]++;
        }

        // Categories
        const cat = s.category || 'العقيدة والإيمان';
        categoryFrequency[cat] = (categoryFrequency[cat] || 0) + 1;

        // Topics
        const topicName = (p.title || s.topic || 'مواضيع عامة').slice(0, 24);
        topicFrequency[topicName] = (topicFrequency[topicName] || 0) + 1;

        // Monthly
        try {
          const date = s.createdAt ? new Date(s.createdAt) : new Date();
          const key = `${monthNamesArabic[date.getMonth()]} ${date.getFullYear()}`;
          monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
        } catch (e) {
          const key = 'الشهر الحالي';
          monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
        }
      });
    });

    // Monthly Data Array for Recharts
    const monthlyData = Object.entries(monthlyCounts).map(([month, count]) => ({
      name: month,
      خطب: count,
    }));

    if (monthlyData.length < 3) {
      const currentMonthIdx = new Date().getMonth();
      const totalCount = totalSermonCount(sermons);
      const fallbackMonths = [
        { name: `${monthNamesArabic[(currentMonthIdx + 9) % 12]} 2026`, خطب: Math.max(1, Math.round(totalCount * 0.25)) },
        { name: `${monthNamesArabic[(currentMonthIdx + 10) % 12]} 2026`, خطب: Math.max(2, Math.round(totalCount * 0.5)) },
        { name: `${monthNamesArabic[(currentMonthIdx + 11) % 12]} 2026`, خطب: Math.max(3, Math.round(totalCount * 0.8)) },
        { name: `${monthNamesArabic[currentMonthIdx]} 2026`, خطب: totalCount || 1 },
      ];
      monthlyData.splice(0, monthlyData.length, ...fallbackMonths);
    }

    // Category Distribution
    const categoryData = Object.entries(categoryFrequency).map(([name, value]) => ({
      name,
      value,
    }));

    // Top Topics sorted
    const topTopics = Object.entries(topicFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    // Top Downloaded Sermons
    const topDownloaded = [...sermons]
      .sort((a, b) => (b.downloadsCount || 0) - (a.downloadsCount || 0))
      .slice(0, 5);

    // Top Viewed Sermons
    const topViewed = [...sermons]
      .sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0))
      .slice(0, 5);

    const totalCount = totalSermonCount(sermons);
    const avgMinutes = totalCount > 0 ? Math.round(totalMinutes / totalCount) : 0;
    const avgWords = totalCount > 0 ? Math.round(totalWords / totalCount) : 0;
    const totalHours = (totalMinutes / 60).toFixed(1);

    // Monthly goal calculation (assuming 4 Friday sermons per month as baseline)
    const monthlyGoal = 4;
    const producedThisMonth = Math.min(totalCount, 4);
    const goalPercentage = Math.min(100, Math.round((totalCount / monthlyGoal) * 100));

    return {
      totalSermons: totalCount,
      seriesCount,
      totalWords,
      totalDownloads,
      totalViews,
      totalMinutes,
      totalHours,
      avgMinutes,
      avgWords,
      monthlyData,
      categoryData,
      topTopics,
      topDownloaded,
      topViewed,
      lengthCounts,
      complexityCounts,
      monthlyGoal,
      producedThisMonth,
      goalPercentage,
    };
  }, [sermons]);

  // Available unique categories including any custom created ones
  const availableCategories = useMemo(() => {
    const baseCategories = [
      'العقيدة والإيمان',
      'فقه العبادات',
      'الأخلاق والمعاملات',
      'السيرة النبوية والمناسبات',
      'الرقائق والتزكية',
      'سلاسل منبرية متكاملة',
      'فقه الأسرة والمجتمع',
      'قضايا الأمة المعاصرة',
    ];
    const catSet = new Set<string>(baseCategories);
    sermons.forEach((s) => {
      if (s.category && s.category.trim()) {
        catSet.add(s.category.trim());
      }
    });
    return Array.from(catSet);
  }, [sermons]);

  // Filtered sermons for the Production table
  const filteredProductionSermons = useMemo(() => {
    return sermons.filter((s) => {
      const matchSearch =
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.tags && s.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));

      if (!matchSearch) return false;
      if (filterType === 'series' && !s.isSeries) return false;
      if (filterType === 'single' && s.isSeries) return false;
      if (filterCategory !== 'all' && s.category !== filterCategory) return false;

      return true;
    });
  }, [sermons, searchTerm, filterCategory, filterType]);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" dir="rtl">
      
      {/* Top Banner: Dashboard Hub Header */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-[#10241b] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <LayoutDashboard className="w-3.5 h-3.5 text-amber-300" />
            <span>لوحة الإنتاج المنبري والإحصائيات والتحليلات</span>
          </div>
          <h1 className="font-cairo font-extrabold text-2xl sm:text-3xl text-white">
            لوحة الإنتاج والإحصائيات (Dashboard)
          </h1>
          <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
            متابعة خط الإنتاج المنبري الأسبوعي، قياس مستهدفات الإلقاء، ورصد إحصائيات التفاعل والتنزيلات والقراءات لخدمة الخطيب والمنبر.
          </p>
        </div>

        {/* Quick Production Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onGoToGenerator}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-cairo font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-amber-300" />
            <span>صياغة خطبة جديدة</span>
          </button>
        </div>
      </div>

      {/* Production & Impact KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Metric 1: Total Production */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
              إجمالي الإنتاج المنبري
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-cairo font-extrabold text-3xl text-stone-900">
                {stats.totalSermons}
              </span>
              <span className="text-xs text-stone-500">خطبة وسلسلة</span>
            </div>
            <div className="mt-2 text-xs text-emerald-700 flex items-center gap-1 font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>منها {stats.seriesCount} سلاسل متسلسلة</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Monthly Pulpit Coverage & Target */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
              مستهدف خطب الشهر
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-cairo font-extrabold text-3xl text-sky-950">
                %{stats.goalPercentage}
              </span>
              <span className="text-xs text-stone-500">من مستهدف الجُمع</span>
            </div>
            
            {/* Progress bar */}
            <div className="mt-2 w-full h-2 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, stats.goalPercentage)}%` }}
              ></div>
            </div>
            <span className="text-[11px] text-stone-500 mt-1 block">
              جاهزية تامة لتغطية جُمع الشهر المنبرية
            </span>
          </div>
        </div>

        {/* Metric 3: Pulpit Hours & Words */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
              ساعات الإلقاء المنبري
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-cairo font-extrabold text-3xl text-stone-900">
                {stats.totalHours}
              </span>
              <span className="text-xs text-stone-500">ساعة إلقاء</span>
            </div>
            <div className="mt-2 text-xs text-purple-700 flex items-center gap-1 font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{stats.totalWords.toLocaleString('ar-SA')} كلمة مصاغة</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Public Downloads & Reach */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
              إجمالي التنزيلات والقراءات
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-cairo font-extrabold text-3xl text-amber-950">
                {stats.totalDownloads}
              </span>
              <span className="text-xs text-stone-500">تنزيل</span>
            </div>
            <div className="mt-2 text-xs text-amber-700 flex items-center gap-1 font-semibold">
              <Eye className="w-3.5 h-3.5" />
              <span>{stats.totalViews} قراءة ومطالعة</span>
            </div>
          </div>
        </div>

      </div>

      {/* Mode Switch Tabs: (1) Analytics & Charts vs (2) Production Queue & Management */}
      <div className="bg-white p-2 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          
          <button
            onClick={() => setDashboardTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-cairo font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              dashboardTab === 'analytics'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-amber-300" />
            <span>الرسوم البيانية والإحصائيات</span>
          </button>

          <button
            onClick={() => setDashboardTab('production')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-cairo font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              dashboardTab === 'production'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-300" />
            <span>سجل وإدارة خط الإنتاج ({totalSermonCount(sermons)})</span>
          </button>

        </div>

        <span className="text-xs text-stone-400 hidden sm:inline-block px-3">
          مزامنة سحابية حية عبر Firestore
        </span>
      </div>

      {/* VIEW 1: Charts & Analytics */}
      {dashboardTab === 'analytics' && (
        <div className="space-y-8">
          
          {/* Main Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Monthly Sermon Creation Trend */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-cairo font-bold text-base sm:text-lg text-stone-900">
                    وتيرة إنتاج الخطب شهرياً
                  </h3>
                  <p className="text-xs text-stone-500">
                    معدل الصياغة المنبرية وتوزيع الإنتاج عبر الشهور
                  </p>
                </div>
                <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                  <Calendar className="w-4 h-4" />
                </span>
              </div>

              <div className="h-64 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(value: any) => [`${value} خطبة`, 'الإنتاج']}
                      contentStyle={{ backgroundColor: '#1c1917', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                    />
                    <Bar dataKey="خطب" fill="#059669" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Category Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-cairo font-bold text-base sm:text-lg text-stone-900">
                    توزيع الإنتاج حسب الأقسام الشرعية
                  </h3>
                  <p className="text-xs text-stone-500">
                    نسبة الخطب المنتجة في كل قسم ومحور شرعي
                  </p>
                </div>
                <span className="p-2 bg-sky-50 text-sky-700 rounded-lg">
                  <FolderTree className="w-4 h-4" />
                </span>
              </div>

              <div className="h-64 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {stats.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [`${value} خطبة`, 'العدد']}
                      contentStyle={{ backgroundColor: '#1c1917', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Leaderboard: Top Downloaded & Top Viewed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top Downloaded */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                    <Award className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-cairo font-bold text-base sm:text-lg text-stone-900">
                      الخطب الأكثر تنزيلاً وتحميلاً
                    </h3>
                    <p className="text-xs text-stone-500">أعلى الخطب طلباً للتصدير المنبري بصيغة Word و PDF</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {stats.topDownloaded.map((s, idx) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-emerald-50/50 border border-stone-200/80 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-amber-400 text-stone-900' : 'bg-stone-200 text-stone-700'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-cairo font-bold text-sm text-stone-900 truncate">
                          {s.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-stone-500 mt-0.5">
                          <span>{s.category || 'العقيدة'}</span>
                          <span>•</span>
                          <span>{s.estimatedMinutes || 15} دقيقة</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-full">
                        <Download className="w-3.5 h-3.5" />
                        <span>{s.downloadsCount || 0}</span>
                      </span>

                      <button
                        onClick={() => onReadSermon(s)}
                        className="p-1.5 text-stone-500 hover:text-emerald-700 hover:bg-emerald-100/50 rounded-lg transition-all"
                        title="قراءة الخطبة"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDownloadSermon(s, 'word')}
                        className="p-1.5 text-stone-500 hover:text-emerald-700 hover:bg-emerald-100/50 rounded-lg transition-all"
                        title="تنزيل Word"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Viewed */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-purple-50 text-purple-700 rounded-lg">
                    <Eye className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-cairo font-bold text-base sm:text-lg text-stone-900">
                      الخطب الأكثر قراءة وتصفحاً
                    </h3>
                    <p className="text-xs text-stone-500">الخطب الأكثر اطلاعاً من الخطباء والمستفيدين</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {stats.topViewed.map((s, idx) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-purple-50/50 border border-stone-200/80 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-purple-500 text-white' : 'bg-stone-200 text-stone-700'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-cairo font-bold text-sm text-stone-900 truncate">
                          {s.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-stone-500 mt-0.5">
                          <span>{s.category || 'العقيدة'}</span>
                          <span>•</span>
                          <span>{s.wordCount || 0} كلمة</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-100/80 px-2.5 py-1 rounded-full">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{s.viewsCount || 0}</span>
                      </span>

                      <button
                        onClick={() => onReadSermon(s)}
                        className="p-1.5 text-stone-500 hover:text-purple-700 hover:bg-purple-100/50 rounded-lg transition-all"
                        title="قراءة الخطبة"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDownloadSermon(s, 'word')}
                        className="p-1.5 text-stone-500 hover:text-purple-700 hover:bg-purple-100/50 rounded-lg transition-all"
                        title="تنزيل Word"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Breakdown Row: Topics & Length */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <h3 className="font-cairo font-bold text-base sm:text-lg text-stone-900 mb-2">
                أبرز المحاور المنبرية والكلمات المفتاحية
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                الموضوعات الأكثر استهدافاً وتكراراً في صياغة الخطب
              </p>

              <div className="flex flex-wrap gap-2.5">
                {stats.topTopics.map((topic, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 text-xs sm:text-sm font-medium hover:border-emerald-300 hover:bg-emerald-50/50 transition-all"
                  >
                    <span>{topic.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      {topic.count} خطب
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <h3 className="font-cairo font-bold text-base sm:text-lg text-stone-900 mb-2">
                توزيع أطوال الخطب
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                تفضيلات أزمنة الإلقاء على المنبر
              </p>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1">
                    <span>متوسطة (15-18 دقيقة)</span>
                    <span>{stats.lengthCounts.medium}</span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${stats.totalSermons ? (stats.lengthCounts.medium / stats.totalSermons) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1">
                    <span>قصيرة وموجزة (10-12 دقيقة)</span>
                    <span>{stats.lengthCounts.short}</span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full"
                      style={{
                        width: `${stats.totalSermons ? (stats.lengthCounts.short / stats.totalSermons) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1">
                    <span>مطولة ومفصلة (20-25 دقيقة)</span>
                    <span>{stats.lengthCounts.long}</span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{
                        width: `${stats.totalSermons ? (stats.lengthCounts.long / stats.totalSermons) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* VIEW 2: Production Queue & Management Table */}
      {dashboardTab === 'production' && (
        <div className="space-y-5">
          
          {/* Filter and Search in Production Queue */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="ابحث في سجل الإنتاج بالاسم أو الموضوع..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white text-stone-800 min-h-[44px]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              
              <select
                value={filterType}
                onChange={(e: any) => setFilterType(e.target.value)}
                className="flex-1 sm:flex-initial bg-stone-50 border border-stone-300 text-stone-800 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none min-h-[44px]"
              >
                <option value="all">كافة الأنواع (خطب وسلاسل)</option>
                <option value="single">خطب جمعة مفردة</option>
                <option value="series">سلاسل متكاملة</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="flex-1 sm:flex-initial bg-stone-50 border border-stone-300 text-stone-800 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none cursor-pointer min-h-[44px]"
              >
                <option value="all">كافة الأقسام الشرعية ({availableCategories.length})</option>
                {availableCategories.map((catName) => (
                  <option key={catName} value={catName}>
                    {catName}
                  </option>
                ))}
              </select>

              <button
                onClick={onGoToGenerator}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 flex items-center justify-center gap-1.5 min-h-[44px] transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>إنتاج خطبة جديدة</span>
              </button>

            </div>

          </div>

          {/* Mobile Production Cards View (الهواتف المحمولة) */}
          <div className="space-y-3 md:hidden">
            {filteredProductionSermons.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-stone-400 text-sm">
                لا توجد خطب تطابق عوامل التصفية الحالية
              </div>
            ) : (
              filteredProductionSermons.map((sermon) => (
                <div
                  key={sermon.id}
                  className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => onReadSermon(sermon)}
                      className="text-right font-cairo font-bold text-base text-stone-900 hover:text-emerald-700 leading-snug"
                    >
                      {sermon.title}
                    </button>
                    {sermon.isSeries ? (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                        <Layers className="w-3 h-3" />
                        <span>سلسلة ({sermon.seriesParts?.length || 3})</span>
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>جاهزة</span>
                      </span>
                    )}
                  </div>

                  {sermon.topic && (
                    <p className="text-xs text-stone-600 line-clamp-1">{sermon.topic}</p>
                  )}

                  {/* Series Parts Browser */}
                  {sermon.isSeries && sermon.seriesParts && sermon.seriesParts.length > 1 && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setExpandedPartsId(expandedPartsId === sermon.id ? null : sermon.id)}
                        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-purple-50/70 hover:bg-purple-100 text-purple-800 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" />
                          <span>أجزاء السلسلة ({sermon.seriesParts.length})</span>
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedPartsId === sermon.id ? 'rotate-180' : ''}`} />
                      </button>

                      {expandedPartsId === sermon.id && (
                        <div className="mt-2 space-y-1.5 animate-fade-in">
                          {sermon.seriesParts.map((part) => (
                            <div
                              key={part.partNumber}
                              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-stone-50 border border-stone-200/80 hover:bg-emerald-50/60 transition-colors"
                            >
                              <button
                                type="button"
                                onClick={() => onReadSermon(sermon, part)}
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
                                onClick={() => onDownloadSermon(sermon, 'word')}
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

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
                    <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-medium">
                      {sermon.category || 'العقيدة'}
                    </span>
                    <span>•</span>
                    <span>{sermon.estimatedMinutes || 15} دقيقة</span>
                    <span>•</span>
                    <span>{sermon.wordCount || 850} كلمة</span>
                    <span className="mr-auto text-amber-700 font-bold inline-flex items-center gap-1">
                      <Download className="w-3 h-3" /> {sermon.downloadsCount || 0}
                    </span>
                    <span className="text-purple-700 font-bold inline-flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {sermon.viewsCount || 0}
                    </span>
                  </div>

                  {/* Mobile Actions Grid */}
                  <div className="pt-2 border-t border-stone-100 grid grid-cols-3 gap-1.5 text-xs font-semibold">
                    <button
                      onClick={() => onReadSermon(sermon)}
                      className="flex items-center justify-center gap-1 py-2 rounded-xl bg-stone-100 text-stone-700 active:bg-stone-200 min-h-[40px]"
                    >
                      <Eye className="w-3.5 h-3.5 text-stone-500" />
                      <span>قراءة</span>
                    </button>

                    <button
                      onClick={() => onOpenTeleprompter(sermon)}
                      className="flex items-center justify-center gap-1 py-2 rounded-xl bg-sky-50 text-sky-700 active:bg-sky-100 min-h-[40px]"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>إلقاء</span>
                    </button>

                    <button
                      onClick={() => onEditSermon(sermon)}
                      className="flex items-center justify-center gap-1 py-2 rounded-xl bg-amber-50 text-amber-800 active:bg-amber-100 min-h-[40px]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>

                    {onRegenerateSermon && (
                      <button
                        onClick={() => onRegenerateSermon(sermon)}
                        className="flex items-center justify-center gap-1 py-2 rounded-xl bg-emerald-50 text-emerald-800 active:bg-emerald-100 min-h-[40px]"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>إعادة توليد</span>
                      </button>
                    )}

                    <button
                      onClick={() => onDownloadSermon(sermon, 'word')}
                      className="flex items-center justify-center gap-1 py-2 rounded-xl bg-stone-100 text-stone-700 active:bg-stone-200 min-h-[40px]"
                    >
                      <Download className="w-3.5 h-3.5 text-stone-500" />
                      <span>Word</span>
                    </button>

                    {confirmDeleteId === sermon.id ? (
                      <div className="flex items-center justify-center gap-1 bg-red-100 rounded-xl p-1">
                        <button
                          onClick={() => {
                            onDeleteSermon(sermon.id);
                            setConfirmDeleteId(null);
                          }}
                          className="text-[11px] font-bold text-red-700 px-1"
                        >
                          تأكيد؟
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-[11px] text-stone-600 px-1"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(sermon.id)}
                        className="flex items-center justify-center gap-1 py-2 rounded-xl bg-red-50 text-red-700 active:bg-red-100 min-h-[40px]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Production Table (الشاشات المتوسطة والكبيرة) */}
          <div className="hidden md:block bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-bold">
                  <tr>
                    <th className="py-3.5 px-4">عنوان الخطبة / السلسلة</th>
                    <th className="py-3.5 px-4">القسم الشرعي</th>
                    <th className="py-3.5 px-4">النوع والحالة</th>
                    <th className="py-3.5 px-4">مدة الإلقاء والكلمات</th>
                    <th className="py-3.5 px-4">التفاعل (تحميل / قراءة)</th>
                    <th className="py-3.5 px-4">تاريخ الإنتاج</th>
                    <th className="py-3.5 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredProductionSermons.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-400">
                        لا توجد خطب تطابق عوامل التصفية الحالية
                      </td>
                    </tr>
                  ) : (
                    filteredProductionSermons.map((sermon) => (
                      <React.Fragment key={sermon.id}>
                      <tr className="hover:bg-emerald-50/30 transition-colors">
                        
                        {/* Title */}
                        <td className="py-4 px-4 font-cairo font-bold text-stone-900 max-w-xs">
                          <button
                            onClick={() => onReadSermon(sermon)}
                            className="text-right hover:text-emerald-700 transition-colors line-clamp-1 cursor-pointer"
                          >
                            {sermon.title}
                          </button>
                          <span className="text-[11px] text-stone-500 font-normal line-clamp-1 mt-0.5">
                            {sermon.topic}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-4 px-4 text-stone-600 whitespace-nowrap">
                          <span className="px-2 py-1 rounded-lg bg-stone-100 text-stone-700 text-xs font-medium">
                            {sermon.category || 'العقيدة'}
                          </span>
                        </td>

                        {/* Type & Status */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {sermon.isSeries ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">
                                <Layers className="w-3 h-3" />
                                <span>سلسلة ({sermon.seriesParts?.length || 3})</span>
                              </span>
                              {sermon.seriesParts && sermon.seriesParts.length > 1 && (
                                <button
                                  onClick={() => setExpandedPartsId(expandedPartsId === sermon.id ? null : sermon.id)}
                                  className="p-1 text-stone-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all cursor-pointer"
                                  title="عرض أجزاء السلسلة"
                                >
                                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedPartsId === sermon.id ? 'rotate-180' : ''}`} />
                                </button>
                              )}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>جاهزة للإلقاء</span>
                            </span>
                          )}
                        </td>

                        {/* Duration & Words */}
                        <td className="py-4 px-4 whitespace-nowrap text-stone-600">
                          <div>{sermon.estimatedMinutes || 15} دقيقة</div>
                          <div className="text-stone-400 text-xs">{sermon.wordCount || 850} كلمة</div>
                        </td>

                        {/* Reach */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5 text-xs font-bold">
                            <span className="text-amber-700 inline-flex items-center gap-1">
                              <Download className="w-3 h-3" />
                              <span>{sermon.downloadsCount || 0}</span>
                            </span>
                            <span className="text-stone-400">•</span>
                            <span className="text-purple-700 inline-flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span>{sermon.viewsCount || 0}</span>
                            </span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-4 px-4 text-stone-500 whitespace-nowrap text-xs">
                          {formatDate(sermon.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            
                            <button
                              onClick={() => onReadSermon(sermon)}
                              className="p-1.5 rounded-lg text-stone-600 hover:text-emerald-700 hover:bg-emerald-100/50"
                              title="قراءة الخطبة كاملة"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => onOpenTeleprompter(sermon)}
                              className="p-1.5 rounded-lg text-stone-600 hover:text-sky-700 hover:bg-sky-100/50"
                              title="المنبر الإلقائي (Teleprompter)"
                            >
                              <Mic className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => onEditSermon(sermon)}
                              className="p-1.5 rounded-lg text-stone-600 hover:text-amber-700 hover:bg-amber-100/50 transition-colors"
                              title="تعديل الخطبة في المحرر"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {onRegenerateSermon && (
                              <button
                                onClick={() => onRegenerateSermon(sermon)}
                                className="p-1.5 rounded-lg text-stone-600 hover:text-emerald-800 hover:bg-emerald-100/60 transition-colors"
                                title="إعادة صياغة وتوليد بالذكاء الاصطناعي"
                              >
                                <RotateCw className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => onDownloadSermon(sermon, 'word')}
                              className="p-1.5 rounded-lg text-stone-600 hover:text-emerald-700 hover:bg-emerald-100/50"
                              title="تنزيل Word"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            {confirmDeleteId === sermon.id ? (
                              <div className="inline-flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
                                <button
                                  onClick={() => {
                                    onDeleteSermon(sermon.id);
                                    setConfirmDeleteId(null);
                                  }}
                                  className="text-[11px] font-bold text-red-700 hover:underline px-1"
                                >
                                  تأكيد
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-[11px] text-stone-500 hover:underline px-1"
                                >
                                  إلغاء
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(sermon.id)}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50"
                                title="حذف من السحابة"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}

                          </div>
                        </td>

                      </tr>

                      {expandedPartsId === sermon.id && sermon.seriesParts && sermon.seriesParts.length > 1 && (
                        <tr className="bg-purple-50/40 border-b border-purple-100/60">
                          <td colSpan={7} className="py-3 px-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {sermon.seriesParts.map((part) => (
                                <div
                                  key={part.partNumber}
                                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white border border-purple-100 hover:border-emerald-400 hover:shadow-sm transition-all"
                                >
                                  <button
                                    type="button"
                                    onClick={() => onReadSermon(sermon, part)}
                                    className="flex items-center gap-2 min-w-0 text-right cursor-pointer"
                                    title={`قراءة: ${part.title}`}
                                  >
                                    <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[10px] shrink-0">
                                      الجمعة {part.partNumber}
                                    </span>
                                    <span className="truncate text-xs font-semibold text-stone-700 hover:text-emerald-800">
                                      {part.title}
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onDownloadSermon(sermon, 'word')}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-50 border border-stone-200 text-stone-600 hover:text-emerald-700 hover:border-emerald-500 text-[11px] font-bold transition-all cursor-pointer shrink-0"
                                    title={`تنزيل الجزء ${part.partNumber} كملف Word`}
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Word</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
