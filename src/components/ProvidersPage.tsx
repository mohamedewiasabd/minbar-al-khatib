import React, { useEffect, useRef, useState } from 'react';
import {
  Cpu,
  KeyRound,
  ShieldCheck,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Info,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PROVIDERS, getProvider, AiProvider } from '../lib/providers';
import {
  ProviderSettings,
  EffectiveProviderSettings,
  subscribeUserSettings,
  subscribeAdminSettings,
  saveUserSettings,
  deleteUserSettings,
  saveAdminSettings,
} from '../lib/providerSettings';

function ProviderBadge({ provider }: { provider: AiProvider }) {
  const colors: Record<string, string> = {
    gemini: 'bg-blue-100 text-blue-800 border-blue-300',
    openai: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    anthropic: 'bg-orange-100 text-orange-800 border-orange-300',
    groq: 'bg-violet-100 text-violet-800 border-violet-300',
    mistral: 'bg-amber-100 text-amber-800 border-amber-300',
    deepseek: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    openrouter: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    ollama: 'bg-stone-100 text-stone-700 border-stone-300',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold ${colors[provider.id] || 'bg-stone-100 text-stone-700 border-stone-300'}`}
    >
      {provider.id}
    </span>
  );
}

function SourceBadge({ source }: { source: EffectiveProviderSettings['source'] }) {
  if (source === 'user') {
    return (
      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full text-[11px] font-bold">
        مفتاحك الخاص
      </span>
    );
  }
  if (source === 'admin') {
    return (
      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full text-[11px] font-bold">
        مفتاح عام من الإدارة
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-600 border border-stone-300 px-2 py-0.5 rounded-full text-[11px] font-bold">
      المفتاح المدمج الافتراضي
    </span>
  );
}

export default function ProvidersPage() {
  const { user, isAdmin, openLoginModal } = useAuth();

  const [userSettings, setUserSettings] = useState<ProviderSettings | null>(null);
  const [adminSettings, setAdminSettings] = useState<ProviderSettings | null>(null);

  // مسودة نموذج المستخدم الشخصي
  const [providerId, setProviderId] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [showKey, setShowKey] = useState(false);

  // مسودة نموذج الإدارة
  const [adminProviderId, setAdminProviderId] = useState('gemini');
  const [adminApiKey, setAdminApiKey] = useState('');
  const [adminModel, setAdminModel] = useState('');
  const [showAdminKey, setShowAdminKey] = useState(false);

  const [userSaved, setUserSaved] = useState<null | 'ok' | 'err'>(null);
  const [adminSaved, setAdminSaved] = useState<null | 'ok' | 'err'>(null);
  const [userMsg, setUserMsg] = useState('');
  const [adminMsg, setAdminMsg] = useState('');
  const userSynced = useRef(false);
  const adminSynced = useRef(false);

  useEffect(() => {
    if (!user) {
      setUserSettings(null);
      setAdminSettings(null);
      userSynced.current = false;
      adminSynced.current = false;
      return () => {};
    }
    const unsubUser = subscribeUserSettings(user.uid, (s) => setUserSettings(s));
    const unsubAdmin = subscribeAdminSettings((s) => setAdminSettings(s));
    return () => {
      unsubUser();
      unsubAdmin();
    };
  }, [user]);

  // مزامنة مسودة المستخدم مع إعداداته المحفوظة (مرة واحدة عند التحميل)
  useEffect(() => {
    if (userSettings && !userSynced.current) {
      userSynced.current = true;
      setProviderId(userSettings.providerId || 'gemini');
      setApiKey(userSettings.apiKey || '');
      setModel(userSettings.model || '');
    }
  }, [userSettings]);

  useEffect(() => {
    if (adminSettings && !adminSynced.current) {
      adminSynced.current = true;
      setAdminProviderId(adminSettings.providerId || 'gemini');
      setAdminApiKey(adminSettings.apiKey || '');
      setAdminModel(adminSettings.model || '');
    }
  }, [adminSettings]);

  // الدقة الفعلية: المستخدم ثم الإدارة ثم المدمج
  const effectiveSource: EffectiveProviderSettings['source'] =
    userSettings?.apiKey && getProvider(userSettings.providerId)
      ? 'user'
      : adminSettings?.apiKey && getProvider(adminSettings.providerId)
        ? 'admin'
        : 'builtin';
  const effectiveProviderId =
    effectiveSource === 'user'
      ? userSettings!.providerId
      : effectiveSource === 'admin'
        ? adminSettings!.providerId
        : 'gemini';
  const activeProvider = getProvider(effectiveProviderId) || PROVIDERS[0];
  const effectiveModel =
    (effectiveSource === 'user' && userSettings?.model
      ? userSettings.model
      : effectiveSource === 'admin' && adminSettings?.model
        ? adminSettings.model
        : '') || activeProvider.defaultModel;

  const selectedProvider = getProvider(providerId) || PROVIDERS[0];
  const selectedAdminProvider = getProvider(adminProviderId) || PROVIDERS[0];

  const handleSaveUser = async () => {
    if (selectedProvider.requiresKey && !apiKey.trim()) {
      setUserMsg('هذا المزوّد يتطلب مفتاح API — أدخل مفتاحك أولاً.');
      setUserSaved('err');
      return;
    }
    try {
      await saveUserSettings(user!.uid, {
        providerId: selectedProvider.id,
        apiKey: apiKey.trim(),
        model: model.trim(),
      });
      setUserSaved('ok');
      setUserMsg('تم حفظ إعداداتك — ستُستخدم في كل عمليات التوليد القادمة.');
    } catch (err: any) {
      setUserSaved('err');
      setUserMsg(err?.message || 'تعذر حفظ الإعدادات، حاول مرة أخرى.');
    }
  };

  const handleClearUser = async () => {
    if (!user) return;
    await deleteUserSettings(user.uid);
    userSynced.current = false;
    setProviderId('gemini');
    setApiKey('');
    setModel('');
    setUserSaved('ok');
    setUserMsg('تمت إزالة إعداداتك الخاصة — سيعود التطبيق للاستخدام العام الافتراضي.');
  };

  const handleSaveAdmin = async () => {
    if (selectedAdminProvider.requiresKey && !adminApiKey.trim()) {
      setAdminMsg('هذا المزوّد يتطلب مفتاح API — أدخل المفتاح العام أولاً.');
      setAdminSaved('err');
      return;
    }
    try {
      await saveAdminSettings({
        providerId: selectedAdminProvider.id,
        apiKey: adminApiKey.trim(),
        model: adminModel.trim(),
      });
      setAdminSaved('ok');
      setAdminMsg('تم حفظ المفتاح العام — سيستخدمه كل من لا يملك مفتاحاً خاصاً به.');
    } catch (err: any) {
      setAdminSaved('err');
      setAdminMsg(err?.message || 'تعذر حفظ المفتاح العام.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-[#10221c] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-900/80 border border-emerald-500/30 flex items-center justify-center">
            <Cpu className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h1 className="font-cairo font-extrabold text-xl sm:text-2xl">المزوّدون — خيارات الذكاء الاصطناعي</h1>
            <p className="text-stone-400 text-xs sm:text-sm mt-0.5">
              اختر مزوّد الصياغة المنبرية، ضع مفتاحك الخاص أو استخدم المفتاح العام الذي توفره الإدارة
            </p>
          </div>
        </div>
      </div>

      {/* Effective status */}
      <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/60 border border-stone-200 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-stone-500">المزوّد المفعّل حالياً للتوليد</p>
              <p className="font-cairo font-bold text-stone-900 text-lg leading-tight">{activeProvider.name}</p>
              <p className="text-[11px] text-stone-500 font-mono" dir="ltr">{effectiveModel}</p>
            </div>
          </div>
          <SourceBadge source={effectiveSource} />
        </div>
        <p className="mt-3 text-xs text-stone-500 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 leading-relaxed">
          التسلسل: مفتاحك الخاص ← المفتاح العام من الإدارة ← المفتاح المدمج الافتراضي (Gemini). النموذج الذي لا تختاره يُحدَّد تلقائياً كنموذج المزوّد الافتراضي.
        </p>
      </div>

      {/* Not logged in hint */}
      {!user && (
        <div className="bg-white rounded-2xl shadow-lg shadow-stone-200/60 border border-stone-200 p-6 text-center">
          <KeyRound className="w-8 h-8 text-stone-400 mx-auto" />
          <h3 className="font-cairo font-bold text-stone-800 mt-3">سجّل دخولك لتضع مفتاحك الخاص</h3>
          <p className="text-sm text-stone-500 mt-1 max-w-lg mx-auto">
            بمفتاحك الخاص تتحكم بالكامل في المزوّد والنموذج، وتتجنب حصص الاستخدام العامة. بدون تسجيل الدخول يعمل التطبيق بالمفتاح العام أو المدمج.
          </p>
          <button
            type="button"
            onClick={() => openLoginModal('تسجيل الدخول لوضع مفتاحك الخاص واختيار مزوّد الذكاء الاصطناعي.')}
            className="mt-4 inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-cairo font-bold shadow transition-all active:scale-95 cursor-pointer"
          >
            تسجيل الدخول
          </button>
        </div>
      )}

      {/* User personal settings */}
      {user && (
        <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/60 border border-stone-200 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="w-5 h-5 text-emerald-600" />
            <h2 className="font-cairo font-bold text-stone-900 text-lg">إعداداتي الشخصية</h2>
            {isAdmin && <span className="text-[11px] text-stone-400">(تطبق على حساباتك)</span>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold text-stone-600">المزوّد الافتراضي</span>
              <select
                value={providerId}
                onChange={(e) => {
                  setProviderId(e.target.value);
                  setModel('');
                }}
                className="mt-1 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-bold text-stone-600">النموذج</span>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">النموذج الافتراضي للمزوّد — {selectedProvider.defaultModel}</option>
                {selectedProvider.models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>

            <label className="block sm:col-span-2">
              <span className="text-xs font-bold text-stone-600">
                مفتاح API {selectedProvider.requiresKey ? '' : '(اختياري — Ollama محلي لا يحتاجه)'}
              </span>
              <div className="relative mt-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  dir="ltr"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={selectedProvider.requiresKey ? 'ألصق مفتاحك هنا' : 'اتركه فارغاً لعدم الحاجة لمفتاح'}
                  className="w-full rounded-xl border border-stone-300 bg-stone-50 pl-10 pr-3 py-2.5 text-sm text-left font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {selectedProvider.signupUrl && (
                <a
                  href={selectedProvider.signupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  الحصول على مفتاح {selectedProvider.name.split(' (')[0]}
                </a>
              )}
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSaveUser}
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-cairo font-bold shadow transition-all active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              حفظ إعداداتي
            </button>
            {userSettings && (
              <button
                type="button"
                onClick={handleClearUser}
                className="inline-flex items-center gap-2 border border-red-300 text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl font-cairo font-bold transition-all active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                استخدام الافتراضي (مسح إعداداتي)
              </button>
            )}
          </div>

          {userMsg && (
            <div
              className={`mt-3 flex items-start gap-2 text-sm rounded-xl px-4 py-3 ${
                userSaved === 'ok'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {userSaved === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              <span>{userMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* Admin shared/default settings */}
      {user && isAdmin && (
        <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl shadow-xl shadow-amber-100/60 border border-amber-300 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <h2 className="font-cairo font-bold text-stone-900 text-lg">الإعداد الافتراضي العام (كل المستخدمين)</h2>
          </div>
          <p className="text-xs text-stone-500 mb-4 leading-relaxed">
            المفتاح العام المشترك + المزوّد والنموذج الافتراضي: يستخدمه كل من ليس له مفتاح شخصي. دون تحديده، يعمل الجميع بالمفتاح المدمج (Gemini).
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold text-stone-600">المزوّد العام</span>
              <select
                value={adminProviderId}
                onChange={(e) => {
                  setAdminProviderId(e.target.value);
                  setAdminModel('');
                }}
                className="mt-1 w-full rounded-xl border border-amber-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-bold text-stone-600">النموذج العام</span>
              <select
                value={adminModel}
                onChange={(e) => setAdminModel(e.target.value)}
                className="mt-1 w-full rounded-xl border border-amber-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">النموذج الافتراضي للمزوّد — {selectedAdminProvider.defaultModel}</option>
                {selectedAdminProvider.models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>

            <label className="block sm:col-span-2">
              <span className="text-xs font-bold text-stone-600">المفتاح العام المشترك</span>
              <div className="relative mt-1">
                <input
                  type={showAdminKey ? 'text' : 'password'}
                  dir="ltr"
                  value={adminApiKey}
                  onChange={(e) => setAdminApiKey(e.target.value)}
                  placeholder={selectedAdminProvider.requiresKey ? 'مفتاح الإدارة شائع الاستخدام لجميع المستخدمين' : 'اختياري'}
                  className="w-full rounded-xl border border-amber-300 bg-white pl-10 pr-3 py-2.5 text-sm text-left font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminKey((v) => !v)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showAdminKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>
          </div>

          <button
            type="button"
            onClick={handleSaveAdmin}
            className="mt-4 inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-cairo font-bold shadow transition-all active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            حفظ المفتاح العام
          </button>

          {adminMsg && (
            <div
              className={`mt-3 flex items-start gap-2 text-sm rounded-xl px-4 py-3 ${
                adminSaved === 'ok'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {adminSaved === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              <span>{adminMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* All known providers */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-emerald-600" />
          <h2 className="font-cairo font-bold text-stone-900 text-lg">المزوّدون المعروفون والنماذج</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {PROVIDERS.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl shadow-lg shadow-stone-200/60 border border-stone-200 p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-cairo font-bold text-stone-900">{p.name}</h3>
                <ProviderBadge provider={p} />
              </div>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">{p.description}</p>
              <p className="text-[11px] text-stone-600 mt-2">
                النموذج الافتراضي: <span className="font-mono font-bold" dir="ltr">{p.defaultModel}</span>
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {p.models.map((m) => (
                  <span key={m} dir="ltr" className="text-[10px] font-mono bg-stone-100 border border-stone-200 text-stone-600 rounded-md px-1.5 py-0.5">
                    {m}
                  </span>
                ))}
              </div>
              {p.signupUrl && (
                <a
                  href={p.signupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  موقع المزوّد
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}