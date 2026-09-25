import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Clock,
  FileText,
  Trash2,
  ExternalLink,
  Layers,
  Sparkles,
  Calendar,
  Tag,
  Mic,
  Edit3,
  Filter,
  Cloud,
  CheckCircle2,
  TrendingUp,
  Download,
  Eye,
  ChevronDown,
  Printer,
  Lock
} from 'lucide-react';
import { Sermon, SeriesPart } from '../types';
import { SermonDashboard } from './SermonDashboard';
import { useAuth } from '../context/AuthContext';


interface CloudLibraryProps {
  sermons: Sermon[];
  onSelectSermon: (sermon: Sermon) => void;
  onDeleteSermon: (id: string) => void;
  onEditSermon: (sermon: Sermon) => void;
  onOpenTeleprompter: (sermon: Sermon) => void;
  onReadSermon?: (sermon: Sermon) => void;
  onDownloadSermon?: (sermon: Sermon, format: 'word' | 'txt' | 'print') => void;
}

export const CloudLibrary: React.FC<CloudLibraryProps> = ({
  sermons,
  onSelectSermon,
  onDeleteSermon,
  onEditSermon,
  onOpenTeleprompter,
  onReadSermon,
  onDownloadSermon,
}) => {
  const { isAdmin, openLoginModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'archive'>('dashboard');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'single' | 'series'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filtered = sermons.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.tags && s.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));

    if (filterType === 'series' && !s.isSeries) return false;
    if (filterType === 'single' && s.isSeries) return false;
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;

    return matchesSearch;
  });

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
    <div className="space-y-8" dir="rtl">
      
      {/* Top View Selector: Dashboard vs Archive */}
      <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-cairo font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-amber-300" />
            <span>لوحة الإحصائيات والمعلومات (Dashboard)</span>
          </button>

          <button
            onClick={() => setActiveTab('archive')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-cairo font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'archive'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>سجل الخطب وإدارة السحابة ({sermons.length})</span>
          </button>

        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-stone-500 font-medium pl-3">
          <Cloud className="w-4 h-4 text-emerald-600" />
          <span>مزامنة سحابية مع Firestore</span>
        </div>
      </div>

      {/* Sub-view 1: Dashboard */}
      {activeTab === 'dashboard' && (
        <SermonDashboard
          sermons={sermons}
          onSelectSermon={onSelectSermon}
          onReadSermon={onReadSermon || onSelectSermon}
          onDownloadSermon={onDownloadSermon || ((s, fmt) => {})}
        />
      )}

      {/* Sub-view 2: Cloud Archive */}
      {activeTab === 'archive' && (
        <div className="space-y-6">
          
          {/* Header & Search Bar */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-cairo font-bold text-xl sm:text-2xl text-stone-900">
                      سجل الخطب والمحفوظات السحابية
                    </h2>
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                      <span>سحابة دائمة</span>
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-500">
                    تصفح جميع الخطب والسلاسل، مع إمكانية القراءة، التعديل، التحميل، والحذف
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    filterType === 'all'
                      ? 'bg-white text-emerald-800 shadow-xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  الكل ({sermons.length})
                </button>
                <button
                  onClick={() => setFilterType('single')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    filterType === 'single'
                      ? 'bg-white text-emerald-800 shadow-xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  خطب مفردة
                </button>
                <button
                  onClick={() => setFilterType('series')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    filterType === 'series'
                      ? 'bg-white text-emerald-800 shadow-xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  سلاسل خطبية
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-5 h-5 text-stone-400 absolute right-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث في عناوين الخطب، الموضوعات، أو الكلمات المفتاحية..."
                className="w-full pr-12 pl-4 py-3 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm bg-stone-50/50"
              />
            </div>
          </div>

          {/* Sermons Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((sermon) => (
                <div
                  key={sermon.id}
                  className="bg-white rounded-2xl border border-stone-200 hover:border-emerald-500/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-5 sm:p-6 space-y-3">
                    
                    {/* Badges & Date */}
                    <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                      <div className="flex items-center gap-1 text-stone-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(sermon.createdAt)}</span>
                      </div>
                      {sermon.isSeries ? (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                          <Layers className="w-3 h-3" />
                          <span>سلسلة ({sermon.seriesParts?.length || sermon.totalSeriesParts || 3} أجزاء)</span>
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          {sermon.category || 'خطبة جمعة'}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3
                      onClick={() => onSelectSermon(sermon)}
                      className="font-cairo font-bold text-base sm:text-lg text-stone-900 group-hover:text-emerald-800 transition-colors cursor-pointer line-clamp-2"
                    >
                      {sermon.title}
                    </h3>

                    {/* Topic / Summary */}
                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {sermon.topic}
                    </p>

                    {/* Downloads & Views Stats */}
                    <div className="flex items-center gap-3 pt-2 text-xs border-t border-stone-100">
                      <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                        <Download className="w-3.5 h-3.5" />
                        <span>{sermon.downloadsCount || 0} تنزيل</span>
                      </span>

                      <span className="inline-flex items-center gap-1 text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{sermon.viewsCount || 0} قراءة</span>
                      </span>

                      <span className="inline-flex items-center gap-1 text-stone-500 mr-auto">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>~{sermon.estimatedMinutes || 15} د</span>
                      </span>
                    </div>

                    {/* Tags */}
                    {sermon.tags && sermon.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {sermon.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                  </div>

                  {/* Action Buttons Footer */}
                  <div className="border-t border-stone-100 bg-stone-50/70 p-3 px-5 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => onSelectSermon(sermon)}
                      className="font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>عرض الخطبة</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1 sm:gap-1.5">
                      {onReadSermon && (
                        <button
                          type="button"
                          onClick={() => onReadSermon(sermon)}
                          className="p-1.5 hover:bg-purple-100 text-stone-600 hover:text-purple-800 rounded-lg transition-colors cursor-pointer"
                          title="قراءة واطلاع كامل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}

                      {onDownloadSermon && (
                        <button
                          type="button"
                          onClick={() => onDownloadSermon(sermon, 'word')}
                          className="p-1.5 hover:bg-blue-100 text-stone-600 hover:text-blue-800 rounded-lg transition-colors cursor-pointer"
                          title="تنزيل Word"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onOpenTeleprompter(sermon)}
                        className="p-1.5 hover:bg-amber-100 text-stone-600 hover:text-amber-800 rounded-lg transition-colors cursor-pointer"
                        title="إلقاء في وضع المنبر"
                      >
                        <Mic className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!isAdmin) {
                            openLoginModal('تعديل نصوص الخطبة وأقسامها مخصص لمسؤول المنبر (Admin) فقط.');
                          } else {
                            onEditSermon(sermon);
                          }
                        }}
                        className="p-1.5 hover:bg-emerald-100 text-stone-600 hover:text-emerald-800 rounded-lg transition-colors cursor-pointer relative"
                        title="تعديل الخطبة (مشرف فقط)"
                      >
                        <Edit3 className="w-4 h-4" />
                        {!isAdmin && <Lock className="w-2.5 h-2.5 text-stone-400 absolute -top-0.5 -right-0.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!isAdmin) {
                            openLoginModal('حذف الخطب من السحابة مخصص لمسؤول المنبر (Admin) فقط.');
                          } else if (confirm(`هل أنت متأكد من رغبتك في حذف خطبة "${sermon.title}" من السحابة؟`)) {
                            onDeleteSermon(sermon.id);
                          }
                        }}
                        className="p-1.5 hover:bg-red-100 text-stone-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer relative"
                        title="حذف من السحابة (مشرف فقط)"
                      >
                        <Trash2 className="w-4 h-4" />
                        {!isAdmin && <Lock className="w-2.5 h-2.5 text-stone-400 absolute -top-0.5 -right-0.5" />}
                      </button>

                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-2xl flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-stone-800 text-base">لا توجد خطب مطابقة للبحث</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                يمكنك كتابة موضوع أو رفع ملف لصياغة خطبة جمعة جديدة وحفظها في مكتبتك السحابية.
              </p>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
