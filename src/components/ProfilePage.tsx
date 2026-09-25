import React, { useState } from 'react';
import {
  Coins,
  Sparkles,
  ShieldCheck,
  LogOut,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  X,
  BadgeCheck,
  History,
  Mail,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePoints } from '../context/PointsContext';
import { SINGLE_SERMON_COST, SERIES_SERMON_COST, POINTS_PER_REWARDED_AD } from '../services/pointsService';
import { isNativeApp } from '../lib/admob';

interface ProfilePageProps {
  onGoToGenerator?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onGoToGenerator }) => {
  const { user, isAdmin, logout, openLoginModal, deleteAccount } = useAuth();
  const { points, profile, transactions, ready, watchRewardedForPoints } = usePoints();
  const [watching, setWatching] = useState(false);
  const [earningMsg, setEarningMsg] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [deleteLocalError, setDeleteLocalError] = useState<string | null>(null);

  const isEmailAccount = Boolean(
    user && (user.providerData || []).some((p) => p.providerId === 'password')
  );

  const isNative = isNativeApp();

  const handleWatchAd = async () => {
    if (!user) {
      openLoginModal('لتجميع النقاط وفتح توليد الخطب، يرجى تسجيل الدخول بحساب Google.');
      return;
    }
    setWatching(true);
    setEarningMsg(null);
    const earned = await watchRewardedForPoints();
    setWatching(false);
    if (earned) {
      setEarningMsg(`أحسنت! رصيدك زاد بمقدار ${POINTS_PER_REWARDED_AD} نقطة.`);
    } else if (isNative) {
      setEarningMsg('لم تكتمل مشاهدة الإعلان حتى النهاية، حاول مرة أخرى.');
    } else {
      setEarningMsg('رصيدك زاد بنجاح.');
    }
  };

  // لم يتم تسجيل الدخول
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-[#122820] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900/80 border border-emerald-500/30 flex items-center justify-center">
              <Coins className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h1 className="font-cairo font-extrabold text-xl sm:text-2xl">حسابي ونقاطي</h1>
              <p className="text-stone-400 text-xs sm:text-sm mt-0.5">اربح النقاط واستخدمها في توليد خطب جديدة</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/60 border border-stone-200 p-6 sm:p-10 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center mb-4">
            <Coins className="w-8 h-8 text-stone-400" />
          </div>
          <h2 className="font-cairo font-bold text-lg text-stone-800">أنت غير مسجّل الدخول</h2>
          <p className="text-sm text-stone-500 mt-2 max-w-md mx-auto leading-relaxed">
            سجّل دخولك بحساب Google للحصول على بروفيل شخصي، ومشاهدة الإعلانات بكسب نقاط تُفتح بها توليد الخطب والسلاسل.
          </p>
          <button
            type="button"
            onClick={() => openLoginModal('تسجيل الدخول بجوجل لفتح البروفيل الشخصي ونظام النقاط.')}
            className="mt-6 inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-xl font-cairo font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>تسجيل الدخول بحساب Google</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-[#122820] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-emerald-900 border border-emerald-500/40 flex items-center justify-center shrink-0">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'المستخدم'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <Coins className="w-7 h-7 text-amber-300" />
                )}
              </div>
              {isAdmin && (
                <span className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-amber-500 border-2 border-stone-900 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-stone-950" />
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-cairo font-extrabold text-xl sm:text-2xl">
                  {user.displayName || 'مستخدم منبر الخطيب'}
                </h1>
                {isAdmin && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3" />
                    مسؤول
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-stone-400 text-xs mt-0.5" dir="ltr">
                <Mail className="w-3.5 h-3.5" />
                <span dir="ltr">{user.email}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 bg-stone-800 hover:bg-red-900/60 border border-stone-600 text-stone-200 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>

      {/* Points Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Balance */}
        <div className="bg-gradient-to-br from-amber-500 via-amber-500 to-orange-500 rounded-3xl p-6 shadow-xl border border-amber-400/60 relative overflow-hidden">
          <div className="absolute -top-6 -left-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="font-cairo font-bold text-sm text-amber-950/80">رصيد نقاطي</span>
              <Coins className="w-6 h-6 text-amber-950/80" />
            </div>
            <div className="mt-4 flex items-end gap-2">
              <span className="font-cairo font-black text-5xl leading-none text-white drop-shadow-sm">
                {ready ? points : '—'}
              </span>
              <span className="font-cairo font-bold text-lg text-amber-950/90 mb-1">نقطة</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-amber-950/80">
              <Sparkles className="w-4 h-4" />
              <span>
                المكتسب {profile?.totalEarned || 0} • المنفَق {profile?.totalSpent || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Cost Guide */}
        <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/60 border border-stone-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-emerald-700" />
            <h3 className="font-cairo font-bold text-base text-stone-800">تكلفة التوليد بالنقاط</h3>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
              <span className="text-emerald-900 flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-emerald-600" />
                خطبة مفردة
              </span>
              <span className="font-cairo font-bold text-emerald-700">{SINGLE_SERMON_COST} نقطة</span>
            </li>
            <li className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
              <span className="text-amber-900 flex items-center gap-2">
                <LayersIcon />
                سلسلة خطب
              </span>
              <span className="font-cairo font-bold text-amber-700">{SERIES_SERMON_COST} نقاط</span>
            </li>
          </ul>
          <p className="text-[11px] text-stone-400 mt-3 leading-relaxed">
            السلسلة تُحسب بنقاط {SERIES_SERMON_COST} خطب حتى لو وُلّدت بأجزاء أقل. توليد المسؤول مجاني دائماً.
          </p>
        </div>

        {/* Watch Ad */}
        <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/60 border border-stone-200 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <PlayCircle className="w-5 h-5 text-red-500" />
            <h3 className="font-cairo font-bold text-base text-stone-800">اربح النقاط</h3>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed mb-4">
            شاهد إعلاناً قصيراً بمكافأة واحصل على <span className="font-bold text-red-600">{POINTS_PER_REWARDED_AD} نقطة</span> مقابل كل مشاهدة كاملة.
          </p>
          <button
            type="button"
            onClick={handleWatchAd}
            disabled={watching}
            className={`mt-auto w-full flex items-center justify-center gap-2 py-3 rounded-xl font-cairo font-bold text-sm text-white shadow-lg transition-all active:scale-95 cursor-pointer ${
              watching
                ? 'bg-stone-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600'
            }`}
          >
            {watching ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جاري عرض الإعلان...</span>
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5" />
                <span>شاهد إعلاناً واكسب {POINTS_PER_REWARDED_AD} نقطة</span>
              </>
            )}
          </button>

          {earningMsg && (
            <div className={`mt-3 flex items-center gap-2 text-xs font-bold rounded-xl px-3 py-2 ${
              earningMsg.includes('زاد') && !earningMsg.includes('لم')
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : 'bg-amber-50 text-amber-700 border border-amber-100'
            }`}>
              {earningMsg.includes('لأ') || earningMsg.includes('لم') ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{earningMsg}</span>
              <button
                type="button"
                onClick={() => setEarningMsg(null)}
                className="mr-auto text-stone-400 hover:text-stone-600 cursor-pointer"
                aria-label="إغلاق"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onGoToGenerator}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-cairo font-bold text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>اذهب إلى توليد الخطبة</span>
          </button>
        </div>
      </div>

      {/* Transactions History */}
      <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/60 border border-stone-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-stone-500" />
          <h3 className="font-cairo font-bold text-base text-stone-800">سجل النقاط</h3>
          {!isNative && (
            <span className="text-[10px] text-stone-400 bg-stone-100 rounded-full px-2 py-0.5">وضع تجريبي (الويب)</span>
          )}
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-sm text-stone-400">
            {ready ? 'لا توجد عمليات بعد. شاهد إعلاناً بكافأة لبدء رصيدك!' : 'جاري تحميل سجل النقاط...'}
          </div>
        ) : (
          <ul className="space-y-2">
            {transactions.map((tx) => (
              <li
                key={tx.id}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 border ${
                  tx.type === 'earn'
                    ? 'bg-emerald-50/70 border-emerald-100'
                    : 'bg-amber-50/70 border-amber-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {tx.type === 'earn' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <div className="text-xs font-bold text-stone-700">{tx.reason}</div>
                    <div className="text-[10px] text-stone-400">{new Date(tx.createdAt).toLocaleString('ar-EG')}</div>
                  </div>
                </div>
                <span className={`font-cairo font-black text-sm ${tx.type === 'earn' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {tx.type === 'earn' ? '+' : '−'}{tx.amount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* منطقة الحذف */}
      <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/60 border border-red-100 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Trash2 className="w-5 h-5 text-red-500" />
          <h3 className="font-cairo font-bold text-base text-stone-800">حذف الحساب</h3>
        </div>
        <p className="text-xs text-stone-500 leading-relaxed mb-4 max-w-2xl">
          حذف حسابك نهائياً للمطابقة مع سياسة Google Play لخصوصية البيانات. سيُحذف حساب تسجيل الدخول وسجل نقطك من خوادمنا، ولا يمكن التراجع عن هذا الإجراء.
        </p>
        <button
          type="button"
          onClick={() => setDeleteConfirmOpen(true)}
          disabled={deleting}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-sm font-cairo font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-60"
        >
          {deleting ? (
            <>
              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              <span>جاري الحذف...</span>
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              <span>حذف حسابي نهائياً</span>
            </>
          )}
        </button>
      </div>

      {/* نافذة تأكيد الحذف */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border border-red-200 w-full max-w-md p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-cairo font-extrabold text-lg text-stone-900">هل أنت متأكد؟</h3>
                <p className="text-sm text-stone-500 mt-1.5 leading-relaxed">
                  سيُحذف حساب تسجيل الدخول وسجل نقاطك نهائياً من خوادمنا. <span className="font-bold text-red-600">لا يمكن التراجع</span>.
                </p>
              </div>
            </div>

            {isEmailAccount && (
              <div className="mt-4">
                <label className="text-xs font-cairo font-bold text-stone-600 block mb-1.5">
                  أدخل كلمة المرور لتأكيد الحذف
                </label>
                <input
                  type="password"
                  value={reauthPassword}
                  onChange={(e) => {
                    setReauthPassword(e.target.value);
                    setDeleteLocalError(null);
                  }}
                  placeholder="كلمة المرور"
                  className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
            )}

            {deleteLocalError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
                {deleteLocalError}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setReauthPassword('');
                  setDeleteLocalError(null);
                }}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-cairo font-bold hover:bg-stone-50 transition-all active:scale-95 cursor-pointer disabled:opacity-60"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (isEmailAccount && !reauthPassword) {
                    setDeleteLocalError('يرجى إدخال كلمة المرور لتأكيد حذف الحساب.');
                    return;
                  }
                  setDeleting(true);
                  setDeleteLocalError(null);
                  try {
                    await deleteAccount(reauthPassword || undefined);
                    setDeleteConfirmOpen(false);
                    setReauthPassword('');
                  } catch (err: any) {
                    if (err?.message === 'reauth-password-required' || err?.message === 'auth/wrong-password') {
                      setDeleteLocalError('كلمة المرور غير صحيحة. حاول مرة أخرى.');
                    }
                  } finally {
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-cairo font-bold shadow transition-all active:scale-95 cursor-pointer disabled:opacity-60"
              >
                {deleting ? 'جاري الحذف...' : 'حذف نهائياً'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function LayersIcon() {
  return (
    <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 2 8.5 4.5-8.5 4.5L3.5 6.5 12 2Z" />
      <path d="m3.5 12 8.5 4.5 8.5-4.5" />
      <path d="m3.5 17.5 8.5 4.5 8.5-4.5" />
    </svg>
  );
}