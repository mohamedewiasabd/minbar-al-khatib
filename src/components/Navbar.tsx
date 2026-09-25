import React from 'react';
import {
  ScrollText,
  Compass,
  PlusCircle,
  LayoutGrid,
  LayoutDashboard,
  ShieldCheck,
  User,
  LogOut,
  Lock,
  Coins,
  AppWindow
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePoints } from '../context/PointsContext';
import { isNativeApp } from '../lib/admob';

export type AppTab = 'home' | 'generator' | 'dashboard' | 'apps' | 'guide' | 'profile';

interface NavbarProps {
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  savedCount: number;
  onNewKhutbah: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  savedCount,
  onNewKhutbah,
}) => {
  const { user, isAdmin, openLoginModal, logout } = useAuth();
  const { points } = usePoints();
  const isNative = isNativeApp();

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 text-stone-100 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-20">
            
            {/* Logo & Brand */}
            <div
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none active:opacity-80"
              onClick={() => setCurrentTab('home')}
            >
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-emerald-100 shadow-lg shadow-emerald-950/40 border border-emerald-500/30 shrink-0">
                <ScrollText className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-cairo font-bold text-base sm:text-xl text-white tracking-wide">
                    مِنْبَر الخَطِيب
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 rounded-full">
                    الذكي
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 font-sans hidden sm:block">
                  أقسام الخطب الجاهزة ولوحة الإنتاج المنبري والإحصائيات
                </p>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <div className="hidden md:flex items-center gap-1 sm:gap-2">
              
              {/* Tab 1: Home / Sermon Departments */}
              <button
                onClick={() => setCurrentTab('home')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-cairo transition-all cursor-pointer ${
                  currentTab === 'home'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <LayoutGrid className="w-4 h-4 text-emerald-300" />
                <span>أقسام الخطب</span>
              </button>

              {/* Tab 2: Generator (Logged-in users with points; admin unlimited) */}
              <button
                onClick={() => {
                  if (!user) {
                    openLoginModal('لتوليد خطب وسلاسل جديدة بالنقاط، يرجى تسجيل الدخول بحساب Google.');
                  } else {
                    setCurrentTab('generator');
                  }
                }}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-cairo transition-all cursor-pointer ${
                  currentTab === 'generator'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-amber-300" />
                <span>صياغة خطبة</span>
                {user && !isAdmin && (
                  <span className="text-[10px] bg-stone-800 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded-md font-sans flex items-center gap-1">
                    <Coins className="w-3 h-3" />
                    {points}
                  </span>
                )}
              </button>

              {/* Tab 3: Dedicated Production & Analytics Dashboard */}
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-cairo transition-all relative cursor-pointer ${
                  currentTab === 'dashboard'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-amber-300" />
                <span>الإنتاج والإحصائيات</span>
                {savedCount > 0 && (
                  <span className="bg-amber-500 text-stone-950 text-xs px-1.5 py-0.2 rounded-full font-bold">
                    {savedCount}
                  </span>
                )}
              </button>

              {/* Tab 4: Our Apps (تطبيقاتنا — يراها الجميع) */}
              <button
                onClick={() => setCurrentTab('apps')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  currentTab === 'apps'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <AppWindow className="w-4 h-4 text-amber-300" />
                <span>تطبيقاتنا</span>
              </button>

              {/* Tab 5: Preacher Guide */}
              <button
                onClick={() => setCurrentTab('guide')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  currentTab === 'guide'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <Compass className="w-4 h-4 text-emerald-400" />
                <span>دليل الخطيب</span>
              </button>

              {/* Tab 5: My Account & Points */}
              <button
                onClick={() => {
                  if (!user) {
                    openLoginModal('لحسابي ونقاطي، يرجى تسجيل الدخول بحساب Google.');
                  } else {
                    setCurrentTab('profile');
                  }
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  currentTab === 'profile'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <User className="w-4 h-4 text-emerald-400" />
                <span>حسابي ونقاطي</span>
                {user && !isAdmin && (
                  <span className="text-[10px] bg-amber-500 font-bold text-stone-950 px-1.5 py-0.5 rounded-full font-sans">
                    {points}
                  </span>
                )}
              </button>

            </div>

            {/* Desktop Auth Status / Login Section */}
            <div className="hidden lg:flex items-center gap-2.5">
              {user ? (
                <div className="flex items-center gap-2 bg-stone-800/90 border border-emerald-500/40 py-1.5 px-3 rounded-2xl cursor-pointer hover:bg-stone-800 transition-colors" onClick={() => setCurrentTab('profile')}>
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-emerald-700 border border-emerald-400 flex items-center justify-center shrink-0">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'المستخدم'}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-bold text-emerald-300 leading-none flex items-center gap-1">
                      <span>{user.displayName?.split(' ')[0] || 'المستخدم'}</span>
                      {isAdmin && <ShieldCheck className="w-3 h-3 text-amber-400" />}
                    </div>
                    <div className="text-[9px] text-stone-400 font-mono truncate max-w-[110px]" dir="ltr">
                      {user.email}
                    </div>
                  </div>
                  {!isAdmin && (
                    <span className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] font-black rounded-full px-1.5 py-0.5 ml-1">
                      <Coins className="w-3 h-3" />
                      {points}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); logout(); }}
                    className="p-1 text-stone-400 hover:text-red-400 hover:bg-stone-700/60 rounded-lg transition-colors cursor-pointer mr-1"
                    title="تسجيل الخروج"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openLoginModal('تسجيل الدخول بحساب Google لبدء تجميع نقاطك وتوليد الخطب.')}
                  className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white border border-stone-600/80 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                  <span>تسجيل الدخول (Google)</span>
                </button>
              )}
            </div>

            {/* Mobile Header Quick Actions */}
            <div className="flex items-center gap-1.5 md:hidden">
              {user ? (
                <button
                  onClick={() => setCurrentTab('profile')}
                  className="flex items-center gap-1 bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 px-2.5 py-1 rounded-xl text-[11px] font-bold"
                >
                  {!isAdmin ? (
                    <>
                      <Coins className="w-3.5 h-3.5 text-amber-300" />
                      <span>{points}</span>
                    </>
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                </button>
              ) : (
                <button
                  onClick={() => openLoginModal('تسجيل الدخول بحساب Google لفتح حسابك ونقاطك.')}
                  className="flex items-center gap-1 bg-stone-800 border border-stone-600 text-stone-200 px-2 py-1 rounded-xl text-[11px] font-bold"
                >
                  <Coins className="w-3 h-3 text-amber-400" />
                  <span>دخول</span>
                </button>
              )}

              <button
                onClick={() => {
                  if (!user) {
                    openLoginModal('لتوليد خطبة جديدة بالنقاط، يرجى تسجيل الدخول.');
                  } else {
                    onNewKhutbah();
                    setCurrentTab('generator');
                  }
                }}
                className="flex items-center gap-1 bg-emerald-600 active:bg-emerald-700 text-white px-2.5 py-1 rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
                <span>صياغة</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile App Bottom Navigation Bar (شريط تنقل سفلي لتطبيقات الموبايل) */}
      <nav
        aria-label="التنقل السفلي للموبايل"
        className="fixed bottom-0 inset-x-0 z-40 bg-stone-950/95 backdrop-blur-xl border-t border-stone-800/90 text-stone-300 md:hidden shadow-[0_-8px_20px_rgba(0,0,0,0.35)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-6 h-16 max-w-md mx-auto">
          
          {/* Tab 1: Home / Library */}
          <button
            type="button"
            onClick={() => {
              setCurrentTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
              currentTab === 'home'
                ? 'text-emerald-400 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${currentTab === 'home' ? 'bg-emerald-950/80 border border-emerald-600/40 text-emerald-300' : ''}`}>
              <LayoutGrid className="w-5 h-5" />
            </div>
            <span className="text-[11px] leading-none">أقسام الخطب</span>
          </button>

          {/* Tab 2: Generator */}
          <button
            type="button"
            onClick={() => {
              if (!user) {
                openLoginModal('لتوليد خطب جديدة بالنقاط، يرجى تسجيل الدخول.');
              } else {
                setCurrentTab('generator');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
              currentTab === 'generator'
                ? 'text-amber-400 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all relative ${currentTab === 'generator' ? 'bg-amber-950/80 border border-amber-600/40 text-amber-300' : ''}`}>
              <PlusCircle className="w-5 h-5" />
              {!user && (
                <Lock className="w-2.5 h-2.5 text-amber-400 absolute top-0 right-0" />
              )}
            </div>
            <span className="text-[11px] leading-none">
              {user ? 'صياغة (بالنقاط)' : 'صياغة'}
            </span>
          </button>

          {/* Tab 3: Dashboard */}
          <button
            type="button"
            onClick={() => {
              setCurrentTab('dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-1 transition-all relative active:scale-95 cursor-pointer ${
              currentTab === 'dashboard'
                ? 'text-emerald-400 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <div className={`p-1 rounded-xl relative transition-all ${currentTab === 'dashboard' ? 'bg-emerald-950/80 border border-emerald-600/40 text-emerald-300' : ''}`}>
              <LayoutDashboard className="w-5 h-5" />
              {savedCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-stone-950 text-[10px] w-4 h-4 rounded-full font-black flex items-center justify-center border border-stone-900">
                  {savedCount > 99 ? '99+' : savedCount}
                </span>
              )}
            </div>
            <span className="text-[11px] leading-none">لوحة الإنتاج</span>
          </button>

          {/* Tab 4: Our Apps */}
          <button
            type="button"
            onClick={() => {
              setCurrentTab('apps');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
              currentTab === 'apps'
                ? 'text-emerald-400 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${currentTab === 'apps' ? 'bg-emerald-950/80 border border-emerald-600/40 text-emerald-300' : ''}`}>
              <AppWindow className="w-5 h-5" />
            </div>
            <span className="text-[11px] leading-none">تطبيقاتنا</span>
          </button>

          {/* Tab 5: Guide */}
          <button
            type="button"
            onClick={() => {
              setCurrentTab('guide');
            }}
            className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
              currentTab === 'guide'
                ? 'text-emerald-400 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${currentTab === 'guide' ? 'bg-emerald-950/80 border border-emerald-600/40 text-emerald-300' : ''}`}>
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-[11px] leading-none">دليل المنبر</span>
          </button>

          {/* Tab 5: My Account & Points */}
          <button
            type="button"
            onClick={() => {
              if (!user) {
                openLoginModal('لحسابك ونقاطك، يرجى تسجيل الدخول.');
              } else {
                setCurrentTab('profile');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className={`flex flex-col items-center justify-center gap-1 transition-all relative active:scale-95 cursor-pointer ${
              currentTab === 'profile'
                ? 'text-amber-400 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <div className={`p-1 rounded-xl relative transition-all ${currentTab === 'profile' ? 'bg-amber-950/80 border border-amber-600/40 text-amber-300' : ''}`}>
              <User className="w-5 h-5" />
              {user && !isAdmin && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-stone-950 text-[9px] min-w-4 h-4 px-0.5 rounded-full font-black flex items-center justify-center border border-stone-900">
                  {points}
                </span>
              )}
            </div>
            <span className="text-[11px] leading-none">حسابي ونقاطي</span>
          </button>

        </div>
      </nav>
    </>
  );
};

