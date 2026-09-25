import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  X,
  Coins,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sparkles,
  BookOpen,
  Mail,
  KeyRound,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const {
    user,
    isAdmin,
    loginModalOpen,
    loginReason,
    loginWithGoogle,
    emailSignIn,
    emailSignUp,
    sendPasswordReset,
    logout,
    closeLoginModal,
    error,
    clearError,
  } = useAuth();

  const [signingIn, setSigningIn] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (!loginModalOpen) {
      setMode('signin');
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setForgotMode(false);
      setResetSent(false);
      setLocalError(null);
    }
  }, [loginModalOpen]);

  if (!loginModalOpen) return null;

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    clearError();
    try {
      await loginWithGoogle();
    } catch (e) {
      // Handled inside context
    } finally {
      setSigningIn(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email.trim() || !password) {
      setLocalError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    setEmailBusy(true);
    try {
      if (mode === 'register') {
        if (password.length < 6) {
          setLocalError('كلمة المرور يجب ألا تقل عن 6 أحرف');
          return;
        }
        if (password !== confirmPassword) {
          setLocalError('كلمتا المرور غير متطابقتين');
          return;
        }
        await emailSignUp(email, password, name);
      } else {
        await emailSignIn(email, password);
      }
    } catch (e) {
      // Handled inside context
    } finally {
      setEmailBusy(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setLocalError('أدخل بريدك الإلكتروني أولاً لإرسال رابط إعادة التعيين');
      return;
    }
    setResetBusy(true);
    setLocalError(null);
    try {
      await sendPasswordReset(email);
      setResetSent(true);
    } catch (e) {
      // Handled inside context
    } finally {
      setResetBusy(false);
    }
  };

  const switchMode = (m: 'signin' | 'register') => {
    setMode(m);
    setForgotMode(false);
    setResetSent(false);
    setLocalError(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-[#fffdf9] rounded-3xl shadow-2xl border border-stone-300/80 overflow-hidden my-auto animate-scale-up">
        
        {/* Header with Islamic Architectural Motif */}
        <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-[#122820] text-white p-6 relative">
          <button
            type="button"
            onClick={closeLoginModal}
            className="absolute top-4 left-4 p-2 text-stone-400 hover:text-white rounded-xl hover:bg-white/10 transition-all cursor-pointer"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-amber-300 shadow-lg shadow-emerald-950/40 border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-400 tracking-wider">
                حسابك الشخصي ونقاطك
              </span>
              <h3 className="font-cairo font-black text-xl text-white">
                تسجيل الدخول أو إنشاء حساب
              </h3>
            </div>
          </div>

          <p className="text-xs text-stone-300 leading-relaxed mt-2">
            {loginReason}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}
          {localError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1 font-medium">{localError}</div>
            </div>
          )}

          {/* If already logged in and is Admin */}
          {isAdmin && user ? (
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full ring-4 ring-emerald-200 overflow-hidden bg-emerald-100 flex items-center justify-center">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'صورة المشرف'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <ShieldCheck className="w-7 h-7 text-emerald-700" />
                )}
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-700 text-white text-[11px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>أنت مسجل كمسؤول معتمد</span>
                </div>
                <h4 className="font-cairo font-bold text-stone-900 text-base mt-1.5">
                  {user.displayName || 'مشرف المنبر'}
                </h4>
                <p className="text-xs text-stone-500 font-mono" dir="ltr">
                  {user.email}
                </p>
              </div>

              <div className="pt-2 border-t border-emerald-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeLoginModal}
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white rounded-xl font-cairo font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  متابعة العمل في المنصة
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="px-3 py-2.5 bg-stone-100 hover:bg-red-50 hover:text-red-700 text-stone-700 rounded-xl font-cairo font-semibold text-xs border border-stone-200 transition-all cursor-pointer flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>خروج</span>
                </button>
              </div>
            </div>
          ) : user && !isAdmin ? (
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>حساب مسجّل بنجاح</span>
                </div>
                <h4 className="font-cairo font-bold text-stone-900 text-sm mt-1.5">
                  {user.displayName || user.email}
                </h4>
                <p className="text-xs text-stone-500 font-mono mt-0.5" dir="ltr">
                  {user.email}
                </p>
                <p className="text-xs text-emerald-900 mt-2 leading-relaxed">
                  يمكنك الآن تجميع النقاط بمشاهدة الإعلانات (نقطة لكل إعلان مكافئ) وتوليد خطبة مفردة بنقطة أو سلسلة خطب بـ 5 نقاط من قسم &quot;حسابي ونقاطي&quot;.
                </p>
              </div>

              <div className="pt-2 border-t border-emerald-200 flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeLoginModal}
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-cairo font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  متابعة وفتح صفحة نقاطي
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-cairo font-semibold text-xs border border-red-200 transition-all cursor-pointer flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>تبديل الحساب</span>
                </button>
              </div>
            </div>
          ) : (

            <>

              {/* Email / Password Panel */}
              {!forgotMode ? (
                <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3 shadow-sm">
                  <div className="flex bg-stone-100 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      className={`flex-1 py-2 rounded-lg text-xs font-cairo font-bold transition-all cursor-pointer ${
                        mode === 'signin'
                          ? 'bg-emerald-700 text-white shadow'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      تسجيل الدخول
                    </button>
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className={`flex-1 py-2 rounded-lg text-xs font-cairo font-bold transition-all cursor-pointer ${
                        mode === 'register'
                          ? 'bg-emerald-700 text-white shadow'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      إنشاء حساب جديد
                    </button>
                  </div>

                  <form onSubmit={handleEmailSubmit} className="space-y-3">
                    {mode === 'register' && (
                      <div className="relative">
                        <UserRound className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="الاسم (اختياري)"
                          className="w-full rounded-xl border border-stone-300 bg-stone-50 px-9 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>
                    )}
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 shrink-0" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="البريد الإلكتروني"
                        dir="ltr"
                        className="w-full rounded-xl border border-stone-300 bg-stone-50 px-9 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 shrink-0" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === 'register' ? 'كلمة المرور (6 أحرف فأكثر)' : 'كلمة المرور'}
                        className="w-full rounded-xl border border-stone-300 bg-stone-50 px-9 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                    {mode === 'register' && (
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 shrink-0" />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="تأكيد كلمة المرور"
                          className="w-full rounded-xl border border-stone-300 bg-stone-50 px-9 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={emailBusy}
                      className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-xl font-cairo font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {emailBusy ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>{mode === 'register' ? 'جاري إنشاء الحساب...' : 'جاري تسجيل الدخول...'}</span>
                        </>
                      ) : mode === 'register' ? (
                        'إنشاء حساب جديد'
                      ) : (
                        'تسجيل الدخول بالبريد وكلمة المرور'
                      )}
                    </button>

                    {mode === 'signin' && !forgotMode && (
                      <button
                        type="button"
                        onClick={() => {
                          setForgotMode(true);
                          setLocalError(null);
                        }}
                        className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer mx-auto block"
                      >
                        نسيت كلمة المرور؟
                      </button>
                    )}
                  </form>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-emerald-700" />
                    <span className="font-cairo font-bold text-sm text-stone-800">إعادة تعيين كلمة المرور</span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.
                  </p>
                  {resetSent ? (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-3 py-2.5 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>تم إرسال رابط إعادة التعيين إلى بريدك.</span>
                    </div>
                  ) : (
                    <>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="البريد الإلكتروني"
                        dir="ltr"
                        className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleResetPassword}
                          disabled={resetBusy}
                          className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-xl font-cairo font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {resetBusy && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                          إرسال الرابط
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotMode(false);
                            setLocalError(null);
                          }}
                          className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-cairo font-semibold text-xs cursor-pointer"
                        >
                          رجوع
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 text-[11px] text-stone-400 font-semibold">
                <span className="flex-1 h-px bg-stone-200" />
                <span>أو سجّل بحساب Google</span>
                <span className="flex-1 h-px bg-stone-200" />
              </div>

              {/* Google Sign-In Action Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={signingIn}
                className="w-full py-3.5 px-4 bg-white hover:bg-stone-50 active:bg-stone-100 border border-stone-300 rounded-2xl font-cairo font-bold text-stone-800 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 min-h-[50px]"
              >
                {signingIn ? (
                  <>
                    <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-stone-700">جاري التحقق عبر Google...</span>
                  </>
                ) : (
                  <>
                    {/* Google SVG Icon */}
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span className="text-sm sm:text-base">
                      تسجيل الدخول بحساب Google
                    </span>
                  </>
                )}
              </button>

              {/* Roles Breakdown Explanation */}
              <div className="bg-stone-100/80 rounded-2xl p-4 border border-stone-200/80 space-y-3 text-xs">
                <div className="font-cairo font-bold text-stone-800 text-[13px] flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <span>كيف يعمل نظام النقاط والصلاحيات:</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-stone-200/60">
                    <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <strong className="text-emerald-900 font-bold block">الأعضاء المسجّلون (نقاط):</strong>
                      <span className="text-stone-600 leading-tight">
                        يربحون نقطة لكل إعلان مكافئ يُشاهدونه. توليد خطبة مفردة بتكلفة نقطة، وسلسلة خطب بـ 5 نقاط من صفحة &quot;حسابي ونقاطي&quot;.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-stone-200/60">
                    <div className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <strong className="text-amber-900 font-bold block">مسؤول المنبر (Admin):</strong>
                      <span className="text-stone-600 leading-tight">
                        توليد وتعديل وإعادة صياغة وحذف الخطب من السحابة مجاناً بدون نقاط، والإشراف على المحتوى العام.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-stone-200/60">
                    <div className="w-5 h-5 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <strong className="text-sky-900 font-bold block">الزوار الكرام (Public):</strong>
                      <span className="text-stone-600 leading-tight">
                        قراءة واطلاع كامل على كافة الخطب والسلاسل، والتنزيل المجاني بصيغ Word وText، ووضع التلقين المنبري (Teleprompter).
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-100/80 border-t border-stone-200 text-center">
          <p className="text-[11px] text-stone-500 font-sans">
            منبر الخطيب الذكي • تسجيل آمن ومباشر عبر خوادم Google Firebase
          </p>
        </div>

      </div>
    </div>
  );
};
