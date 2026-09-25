import React, { useState, useEffect } from 'react';
import { Sermon, GenerateRequest, SeriesPart, SermonLength, SermonComplexity, SermonTone } from './types';
import {
  fetchSermons,
  saveSermonToCloud,
  deleteSermonFromCloud,
  generateKhutbahApi,
  subscribeToSermons,
  trackSermonStat,
} from './services/api';
import { Navbar } from './components/Navbar';
import { HomePublicShowcase } from './components/HomePublicShowcase';
import { SermonGeneratorForm } from './components/SermonGeneratorForm';
import { SermonViewer } from './components/SermonViewer';
import { SermonEditor } from './components/SermonEditor';
import { TeleprompterModal } from './components/TeleprompterModal';
import { SermonDashboard } from './components/SermonDashboard';
import { SermonReaderModal } from './components/SermonReaderModal';
import { PulpitGuideModal } from './components/PulpitGuideModal';
import { RegenerateSermonModal } from './components/RegenerateSermonModal';
import { AuthModal } from './components/AuthModal';
import { exportAsWordDoc, exportAsText, triggerPrintWindow } from './utils/exportHelpers';

import { CheckCircle2, AlertCircle, X, Sparkles, BookOpen, Layers } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useAdMob } from './context/AdMobContext';
import { usePoints } from './context/PointsContext';
import { showRewardedAd } from './lib/admob';
import { totalSermonCount } from './utils/sermonStats';
import { ProfilePage } from './components/ProfilePage';
import { PointsGateModal } from './components/PointsGateModal';
import AppsPage from './components/AppsPage';

export default function App() {
  const { isAdmin, openLoginModal } = useAuth();
  const { isNative, adMobReady, showBanner } = useAdMob();
  const { points, watchRewardedForPoints, spendPointsForGeneration, refundPoints } = usePoints();
  const [currentTab, setCurrentTab] = useState<'home' | 'generator' | 'dashboard' | 'apps' | 'guide' | 'profile'>('home');

  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [currentSermon, setCurrentSermon] = useState<Sermon | null>(null);
  const [readingSermon, setReadingSermon] = useState<Sermon | null>(null);
  const [readingSermonPart, setReadingSermonPart] = useState<SeriesPart | null>(null);
  const [regeneratingSermon, setRegeneratingSermon] = useState<Sermon | null>(null);
  const [generatorInitialValues, setGeneratorInitialValues] = useState<Partial<GenerateRequest> | null>(null);
  const [activeSeriesPart, setActiveSeriesPart] = useState<SeriesPart | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isTeleprompterOpen, setIsTeleprompterOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Points gate: shown when a logged-in non-admin tries to generate/regenerate with insufficient points
  const [pointsGateOpen, setPointsGateOpen] = useState<boolean>(false);
  const [pointsGateAction, setPointsGateAction] = useState<{
    cost: number;
    isSeries: boolean;
    isRegenerate: boolean;
    type: 'generate' | 'regenerate';
    request?: GenerateRequest;
    sermon?: Sermon;
    regenerateOptions?: {
      customInstructions?: string;
      replaceExisting: boolean;
      length?: SermonLength;
      complexity?: SermonComplexity;
      tone?: SermonTone;
    };
  } | null>(null);

  // Load sermons from cloud on mount and listen in real-time
  useEffect(() => {
    loadCloudSermons();
    const unsubscribe = subscribeToSermons((cloudSermons) => {
      if (cloudSermons.length > 0) {
        setSermons(cloudSermons);
        setCurrentSermon((prev) => {
          if (!prev) return cloudSermons[0];
          const matched = cloudSermons.find((s) => s.id === prev.id);
          return matched || prev;
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const loadCloudSermons = async () => {
    try {
      const data = await fetchSermons();
      setSermons(data);
      if (!currentSermon && data.length > 0) {
        setCurrentSermon(data[0]);
      }
    } catch (err) {
      console.error('Failed to load sermons:', err);
    }
  };

  // عرض البانر السفلي في لوحة الإحصائيات فقط؛
  // أما الواجهة العامة فتستخدم وحدات الإعلان المدمجة مع المحتوى (فشل البانر يمنع ازدواجه)
  useEffect(() => {
    if (!isNative || !adMobReady) return;
    if (currentTab === 'dashboard') {
      showBanner();
    }
  }, [currentTab, isNative, adMobReady, showBanner]);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    const duration = type === 'error' ? 7000 : 4000;
    setTimeout(() => {
      setNotification((curr) => (curr?.text === text ? null : curr));
    }, duration);
  };

  const handleGenerate = async (request: GenerateRequest) => {
    // Admin generates free of charge
    if (isAdmin) {
      try {
        await runGeneration(request);
      } catch {
        // notification already shown inside runGeneration
      }
      return;
    }

    const cost = request.isSeries ? 5 : 1;

    // Logged-in non-admin: require sufficient points before generating
    if (points >= cost) {
      const gifted = await spendPointsForGeneration(cost, request.isSeries ? 'توليد سلسلة خطب' : 'توليد خطبة');
      if (!gifted) {
        showNotification('تعذر خصم النقاط. حاول مرة أخرى.', 'error');
        return;
      }
      try {
        await runGeneration(request);
      } catch (err: any) {
        await refundPoints(cost, 'استرجاع نقاط بعد فشل التوليد');
        // notification already shown inside runGeneration
      }
      return;
    }

    // Insufficient points → open the points gate modal
    setPointsGateAction({
      cost,
      isSeries: Boolean(request.isSeries),
      isRegenerate: false,
      type: 'generate',
      request,
    });
    setPointsGateOpen(true);
  };

  const runGeneration = async (request: GenerateRequest) => {
    setIsLoading(true);
    try {
      const generated = await generateKhutbahApi(request);
      setCurrentSermon(generated);
      setActiveSeriesPart(generated.seriesParts && generated.seriesParts.length > 0 ? generated.seriesParts[0] : null);
      setIsEditing(false);

      // Update local list
      setSermons((prev) => [generated, ...prev.filter((s) => s.id !== generated.id)]);

      showNotification(
        generated.isSeries
          ? `تمت صياغة سلسلة الخطب بنجاح (${generated.seriesParts?.length} أجزاء) وحفظها سحابياً!`
          : 'تمت صياغة خطبة الجمعة بنجاح وحفظها سحابياً!'
      );

      // Scroll to viewer smoothly
      window.scrollTo({ top: 400, behavior: 'smooth' });
    } catch (err: any) {
      showNotification(err?.message || 'فشل توليد الخطبة، يرجى المحاولة مرة أخرى', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSermon = async (updatedSermon: Sermon) => {
    if (!isAdmin) {
      openLoginModal('حفظ وتعديل الخطب في السحابة مخصص لمسؤول المنبر (Admin) فقط.');
      return;
    }
    try {
      const saved = await saveSermonToCloud(updatedSermon);
      setCurrentSermon(saved);
      setSermons((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
      setIsEditing(false);
      showNotification('تم حفظ التعديلات سحابياً بنجاح!');
    } catch (err: any) {
      showNotification('فشل حفظ الخطبة في السحابة', 'error');
    }
  };

  const handleDeleteSermon = async (id: string) => {
    if (!isAdmin) {
      openLoginModal('حذف الخطب من السحابة مخصص لمسؤول المنبر (Admin) فقط.');
      return;
    }
    try {
      await deleteSermonFromCloud(id);
      setSermons((prev) => prev.filter((s) => s.id !== id));
      if (currentSermon?.id === id) {
        const remaining = sermons.filter((s) => s.id !== id);
        setCurrentSermon(remaining.length > 0 ? remaining[0] : null);
      }
      if (readingSermon?.id === id) {
        setReadingSermon(null);
        setReadingSermonPart(null);
      }
      showNotification('تم حذف الخطبة من السحابة بنجاح');
    } catch (err: any) {
      showNotification('فشل حذف الخطبة', 'error');
    }
  };

  const handleOpenRegenerateModal = (sermon: Sermon) => {
    setRegeneratingSermon(sermon);
  };

  const regenerateSermonCore = async (
    targetSermon: Sermon,
    options: {
      customInstructions?: string;
      replaceExisting: boolean;
      length?: SermonLength;
      complexity?: SermonComplexity;
      tone?: SermonTone;
    }
  ) => {
    const cost = targetSermon.isSeries ? 5 : 1;

    // Non-admin must have sufficient points to regenerate
    if (!isAdmin) {
      if (points < cost) {
        setPointsGateAction({
          cost,
          isSeries: targetSermon.isSeries,
          isRegenerate: true,
          type: 'regenerate',
          sermon: targetSermon,
          regenerateOptions: options,
        });
        setPointsGateOpen(true);
        setRegeneratingSermon(null);
        return;
      }
      const gifted = await spendPointsForGeneration(cost, targetSermon.isSeries ? 'إعادة توليد سلسلة خطب' : 'إعادة توليد خطبة');
      if (!gifted) {
        showNotification('تعذر خصم النقاط. حاول مرة أخرى.', 'error');
        setRegeneratingSermon(null);
        return;
      }
    }

    setIsLoading(true);
    setRegeneratingSermon(null);

    try {
      const isSeries = !!targetSermon.isSeries;
      const partsCount = targetSermon.seriesParts?.length || targetSermon.totalSeriesParts || 3;

      let promptInstructions = options.customInstructions || '';
      if (!promptInstructions) {
        promptInstructions = `إعادة صياغة وتوليد نسخة جديدة بليغة ومتجددة بأسلوب السهل الممتنع لموضوع: "${targetSermon.title}".`;
      }

      const request: GenerateRequest = {
        mode: isSeries ? 'book_series' : (targetSermon.mode || 'topic'),
        topic: targetSermon.topic || targetSermon.title,
        category: targetSermon.category || 'العقيدة والإيمان',
        length: options.length || targetSermon.length || 'medium',
        complexity: options.complexity || targetSermon.complexity || 'simple',
        tone: options.tone || targetSermon.tone || 'exhortative',
        isSeries,
        seriesPartsCount: partsCount,
        customInstructions: promptInstructions,
      };

      const generated = await generateKhutbahApi(request);

      let finalSermon: Sermon;
      if (options.replaceExisting) {
        finalSermon = {
          ...generated,
          id: targetSermon.id,
          createdAt: targetSermon.createdAt,
          viewsCount: targetSermon.viewsCount || 0,
          downloadsCount: targetSermon.downloadsCount || 0,
        };
        await saveSermonToCloud(finalSermon);
        setSermons((prev) => prev.map((s) => (s.id === finalSermon.id ? finalSermon : s)));
      } else {
        finalSermon = generated;
        setSermons((prev) => [finalSermon, ...prev.filter((s) => s.id !== finalSermon.id)]);
      }

      setCurrentSermon(finalSermon);
      setActiveSeriesPart(finalSermon.seriesParts && finalSermon.seriesParts.length > 0 ? finalSermon.seriesParts[0] : null);
      setIsEditing(false);
      setCurrentTab('generator');

      showNotification(
        options.replaceExisting
          ? `تمت إعادة صياغة خطبة "${finalSermon.title}" وتحديثها بنجاح!`
          : `تم توليد نسخة جديدة بعنوان "${finalSermon.title}" وحفظها سحابياً!`
      );
      window.scrollTo({ top: 380, behavior: 'smooth' });
    } catch (err: any) {
      if (!isAdmin) {
        await refundPoints(cost, 'استرجاع نقاط بعد فشل إعادة التوليد');
      }
      showNotification(err?.message || 'فشل إعادة توليد الخطبة، يرجى المحاولة لاحقاً', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmRegenerate = async (options: {
    customInstructions?: string;
    replaceExisting: boolean;
    length?: SermonLength;
    complexity?: SermonComplexity;
    tone?: SermonTone;
  }) => {
    if (!regeneratingSermon) return;
    await regenerateSermonCore(regeneratingSermon, options);
  };

  const handleOpenInGeneratorWithValues = (sermon: Sermon) => {
    if (!isAdmin) {
      openLoginModal('صياغة وتعديل الخطب بالذكاء الاصطناعي مخصص لمسؤول المنبر (Admin) فقط.');
      return;
    }
    setGeneratorInitialValues({
      topic: sermon.topic || sermon.title,
      category: sermon.category || 'العقيدة والإيمان',
      mode: sermon.isSeries ? 'book_series' : (sermon.mode || 'topic'),
      length: sermon.length || 'medium',
      complexity: sermon.complexity || 'simple',
      tone: sermon.tone || 'exhortative',
      isSeries: !!sermon.isSeries,
      seriesPartsCount: sermon.seriesParts?.length || sermon.totalSeriesParts || 3,
      customInstructions: sermon.notes || '',
    });
    setCurrentTab('generator');
    setIsEditing(false);
    setRegeneratingSermon(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  // View / Read a Sermon full content before downloading
  const handleReadSermon = async (sermon: Sermon, part?: SeriesPart | null) => {
    // إعلان بمكافأة: نعرضه إن توفر، لكن الوصول إلى قراءة الخطب مضمون دائماً
    // حتى لو لم يُحمَّل الإعلان أو أغلق المستخدم النافذة قبل نهايتها.
    if (isNative) {
      try {
        await showRewardedAd();
      } catch (err) {
        console.warn('Rewarded ad not available for reading, opening sermon anyway:', err);
      }
    }

    setReadingSermon(part ? { ...sermon, seriesParts: sermon.seriesParts } : sermon);
    setReadingSermonPart(part || null);
    // Track view count
    await trackSermonStat(sermon.id, 'view');
    setSermons((prev) =>
      prev.map((s) => (s.id === sermon.id ? { ...s, viewsCount: (s.viewsCount || 0) + 1 } : s))
    );
    if (currentSermon && currentSermon.id === sermon.id) {
      setCurrentSermon((prev) => (prev ? { ...prev, viewsCount: (prev.viewsCount || 0) + 1 } : null));
    }
  };

  // Download a Sermon directly or from reader
  const handleDownloadSermon = async (
    sermon: Sermon,
    format: 'word' | 'txt' | 'print',
    part?: SeriesPart | null
  ) => {
    // إعلان بمكافأة: يشاهد المستخدم إعلاناً قصيراً مقابل تنزيل الخطبة
    if (isNative) {
      const { rewarded } = await showRewardedAd();
      if (!rewarded) {
        showNotification('شاهد الإعلان حتى النهاية لإتمام تنزيل الخطبة.', 'error');
        return;
      }
    }

    let result: string | null = null;
    if (format === 'word') {
      result = await exportAsWordDoc(sermon, part);
    } else if (format === 'txt') {
      result = await exportAsText(sermon, part);
    } else if (format === 'print') {
      triggerPrintWindow(sermon, part);
      result = 'web';
    }

    // Track download count in Firestore and mirror
    await trackSermonStat(sermon.id, 'download');
    setSermons((prev) =>
      prev.map((s) => (s.id === sermon.id ? { ...s, downloadsCount: (s.downloadsCount || 0) + 1 } : s))
    );
    if (currentSermon && currentSermon.id === sermon.id) {
      setCurrentSermon((prev) =>
        prev ? { ...prev, downloadsCount: (prev.downloadsCount || 0) + 1 } : null
      );
    }
    if (readingSermon && readingSermon.id === sermon.id) {
      setReadingSermon((prev) =>
        prev ? { ...prev, downloadsCount: (prev.downloadsCount || 0) + 1 } : null
      );
    }

    if (result && result !== 'web' && isNative) {
      showNotification(`تم حفظ خطبة "${sermon.title}" بنجاح في مجلد التنزيلات داخل هاتفك.`, 'success');
    } else {
      showNotification(`تم بدء تنزيل خطبة "${sermon.title}" بنجاح!`);
    }
  };

  const handleSelectSermonFromLibrary = (sermon: Sermon) => {
    setCurrentSermon(sermon);
    setActiveSeriesPart(sermon.seriesParts && sermon.seriesParts.length > 0 ? sermon.seriesParts[0] : null);
    setIsEditing(false);
    setCurrentTab('generator');
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const handleEditSermonFromLibrary = (sermon: Sermon) => {
    if (!isAdmin) {
      openLoginModal('تعديل نصوص الخطبة وأقسامها مخصص لمسؤول المنبر (Admin) فقط.');
      return;
    }
    setCurrentSermon(sermon);
    setActiveSeriesPart(sermon.seriesParts && sermon.seriesParts.length > 0 ? sermon.seriesParts[0] : null);
    setIsEditing(true);
    setCurrentTab('generator');
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };


  const handleOpenTeleprompter = (sermon: Sermon, part?: SeriesPart | null) => {
    setCurrentSermon(sermon);
    setActiveSeriesPart(part || (sermon.seriesParts && sermon.seriesParts.length > 0 ? sermon.seriesParts[0] : null));
    setIsTeleprompterOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#fcfbf7] text-stone-900 font-sans pb-28 sm:pb-24 selection:bg-emerald-200" dir="rtl">
      
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          if (tab === 'guide') {
            setIsGuideOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        savedCount={totalSermonCount(sermons)}
        onNewKhutbah={() => {
          setCurrentTab('generator');
          setIsEditing(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in flex items-center gap-3 bg-stone-900 text-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl shadow-2xl border border-stone-700 text-xs sm:text-sm font-semibold max-w-sm sm:max-w-md w-[calc(100%-2rem)] mx-auto">
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span className="flex-1 text-right leading-snug">{notification.text}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-stone-800 rounded-lg text-stone-400 hover:text-white cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main App Container */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8">
        
        {/* Tab 1: Home Public Showcase (Separated Ready Sermons by Category with Public Stats) */}
        {currentTab === 'home' && (
          <HomePublicShowcase
            sermons={sermons}
            onReadSermon={handleReadSermon}
            onDownloadSermon={(sermon, format, part) => handleDownloadSermon(sermon, format, part)}
            onOpenTeleprompter={(sermon) => handleOpenTeleprompter(sermon)}
            onGoToGenerator={() => {
              setCurrentTab('generator');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onEditSermon={handleEditSermonFromLibrary}
            onRegenerateSermon={handleOpenRegenerateModal}
            onDeleteSermon={handleDeleteSermon}
          />
        )}

        {/* Tab 2: Generator & Current Sermon Workspace */}
        {currentTab === 'generator' && (
          <div className="space-y-10">
            
            {/* Header description for the generator */}
            <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-[#122820] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-800">
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>محرك الصياغة المنبرية الذكي • اقتباسات موثقة من القرآن والسنة</span>
                </div>
                <h1 className="font-cairo font-extrabold text-2xl sm:text-3xl text-white">
                  صياغة خطبة جمعة مخصصة أو تحويل كتاب إلى سلسلة خطب
                </h1>
                <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
                  أدخل موضوعاً، أو ارفع ملفاً (PDF, Docx, MD, TXT, HTML)، وحدد الطول ومستوى البلاغة ونبرة الإلقاء ليقوم الذكاء الاصطناعي بصياغة خطبة نموذجية محكمة وحفظها سحابياً.
                </p>
              </div>
            </div>

            {/* Generator Form */}
            <SermonGeneratorForm
              onGenerate={handleGenerate}
              isLoading={isLoading}
              initialValues={generatorInitialValues || undefined}
            />

            {/* Editing Mode Or Viewing Mode */}
            {isEditing && currentSermon ? (
              <SermonEditor
                sermon={currentSermon}
                activePart={activeSeriesPart}
                onSave={handleSaveSermon}
                onClose={() => setIsEditing(false)}
              />
            ) : currentSermon ? (
              <SermonViewer
                sermon={currentSermon}
                onEdit={(part) => {
                  setActiveSeriesPart(part || null);
                  setIsEditing(true);
                }}
                onOpenTeleprompter={(part) => {
                  setActiveSeriesPart(part || null);
                  setIsTeleprompterOpen(true);
                }}
                onSaveCloud={handleSaveSermon}
                onRegenerate={(sermon) => handleOpenRegenerateModal(sermon)}
                onDelete={(id) => handleDeleteSermon(id)}
              />
            ) : null}

          </div>
        )}

        {/* Tab 3: Dedicated Production & Analytics Dashboard */}
        {currentTab === 'dashboard' && (
          <SermonDashboard
            sermons={sermons}
            onSelectSermon={handleSelectSermonFromLibrary}
            onDeleteSermon={handleDeleteSermon}
            onEditSermon={handleEditSermonFromLibrary}
            onRegenerateSermon={(sermon) => handleOpenRegenerateModal(sermon)}
            onOpenTeleprompter={(sermon) => handleOpenTeleprompter(sermon)}
            onReadSermon={handleReadSermon}
            onDownloadSermon={(sermon, format) => handleDownloadSermon(sermon, format)}
            onGoToGenerator={() => {
              setCurrentTab('generator');
              setIsEditing(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Tab 5: My Account & Points (البروفيل الشخصي ونظام النقاط) */}
        {currentTab === 'profile' && (
          <ProfilePage
            onGoToGenerator={() => {
              setIsEditing(false);
              setCurrentTab('generator');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Tab: تطبيقاتنا — يراها الجميع ويديرها المسؤول فقط */}
        {currentTab === 'apps' && <AppsPage />}

      </main>

      {/* Standalone Sermon Reader Modal (Read Before Download & Public Stats) */}
      {readingSermon && (
        <SermonReaderModal
          sermon={readingSermon}
          activePart={readingSermonPart}
          onClose={() => {
            setReadingSermon(null);
            setReadingSermonPart(null);
          }}
          onDownload={(sermon, format, part) => handleDownloadSermon(sermon, format, part)}
          onOpenTeleprompter={(sermon, part) => {
            setReadingSermon(null);
            handleOpenTeleprompter(sermon, part);
          }}
          onEdit={(sermon, part) => {
            setReadingSermon(null);
            setCurrentSermon(sermon);
            setActiveSeriesPart(part || null);
            setIsEditing(true);
            setCurrentTab('generator');
          }}
          onRegenerate={(sermon) => {
            setReadingSermon(null);
            handleOpenRegenerateModal(sermon);
          }}
          onDelete={(id) => {
            handleDeleteSermon(id);
          }}
        />
      )}

      {/* Regenerate Sermon Modal */}
      {regeneratingSermon && (
        <RegenerateSermonModal
          sermon={regeneratingSermon}
          isOpen={Boolean(regeneratingSermon)}
          isLoading={isLoading}
          onClose={() => setRegeneratingSermon(null)}
          onConfirmRegenerate={handleConfirmRegenerate}
          onOpenInGenerator={handleOpenInGeneratorWithValues}
        />
      )}

      {/* Global Auth Modal for Admin Login & Visitor Info */}
      <AuthModal />

      {/* Points Gate Modal (earn points by watching rewarded ads before generating) */}
      <PointsGateModal
        isOpen={pointsGateOpen}
        points={points}
        cost={pointsGateAction?.cost || 0}
        isSeries={Boolean(pointsGateAction?.isSeries)}
        isRegenerate={pointsGateAction?.isRegenerate || false}
        isGenerating={isLoading}
        onClose={() => {
          setPointsGateOpen(false);
          setPointsGateAction(null);
        }}
        onWatchAd={async () => {
          const ok = await watchRewardedForPoints();
          return ok;
        }}
        onGoToProfile={() => {
          setPointsGateOpen(false);
          setCurrentTab('profile');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onGenerate={() => {
          const action = pointsGateAction;
          if (!action) return;
          setPointsGateOpen(false);
          setPointsGateAction(null);
          if (action.type === 'generate' && action.request) {
            handleGenerate(action.request);
          } else if (action.type === 'regenerate' && action.sermon) {
            setRegeneratingSermon(action.sermon);
            regenerateSermonCore(action.sermon, action.regenerateOptions || { replaceExisting: true });
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />


      {/* Teleprompter / Preacher Delivery Modal */}
      {isTeleprompterOpen && currentSermon && (
        <TeleprompterModal
          sermon={currentSermon}
          activePart={activeSeriesPart}
          onClose={() => setIsTeleprompterOpen(false)}
        />
      )}

      {/* Pulpit Preacher Guide Modal */}
      {isGuideOpen && (
        <PulpitGuideModal onClose={() => setIsGuideOpen(false)} />
      )}

      {/* Dignified Footer */}
      <footer className="mt-20 border-t border-stone-200/80 pt-8 text-center text-xs text-stone-500 max-w-5xl mx-auto px-4">
        <p className="font-amiri text-sm text-stone-600 mb-2 font-bold">
          ﴿ قُلْ هَٰذِهِ سَبِيلِي أَدْعُو إِلَى اللَّهِ عَلَىٰ بَصِيرَةٍ أَنَا وَمَنِ اتَّبَعَنِي ﴾
        </p>
        <p>منصة منبر الخطيب الذكية • لخطباء وأئمة الجمعة لخدمة الدعوة والكلمة الطيبة • إحصائيات عامة وحفظ سحابي</p>
      </footer>

    </div>
  );
}
