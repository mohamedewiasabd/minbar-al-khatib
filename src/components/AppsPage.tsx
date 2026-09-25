import React, { useState, useEffect } from 'react';
import {
  AppWindow,
  Package,
  Plus,
  Pencil,
  Trash2,
  Play,
  ShieldCheck,
  Smartphone,
  X,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppInfo } from '../types';
import { subscribeToApps, addApp, updateApp, removeApp, AppInput } from '../services/appsService';
import { openExternalApp, supportsNativeOpen } from '../lib/appLauncher';

const PACKAGE_REGEX = /^[A-Za-z0-9_]+(\.[A-Za-z0-9_]+)+$/;
const emptyForm: AppInput = { name: '', details: '', packageName: '' };

const AppsPage: React.FC = () => {
  const { isAdmin, user, openLoginModal } = useAuth();
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Management form state
  const [form, setForm] = useState<AppInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const isNative = supportsNativeOpen();

  useEffect(() => {
    const unsubscribe = subscribeToApps((list) => {
      setApps(list);
      setLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  const validate = (): string | null => {
    if (!form.name.trim()) return 'أدخل اسم التطبيق.';
    if (!form.details.trim()) return 'أدخل وصفاً مختصراً للتطبيق.';
    if (!form.packageName.trim()) return 'أدخل اسم الحزمة (Package Name).';
    if (!PACKAGE_REGEX.test(form.packageName.trim())) {
      return 'اسم الحزمة غير صالح — مثال صحيح: com.example.app';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      openLoginModal('إدارة صفحة تطبيقاتنا مخصصة لمسؤول المنبر فقط.');
      return;
    }
    const error = validate();
    if (error) {
      setFormError(error);
      return;
    }
    setFormError(null);
    setBusy(true);
    try {
      if (editingId) {
        await updateApp(editingId, form);
        setEditingId(null);
      } else {
        await addApp(form);
      }
      setForm(emptyForm);
    } catch (err) {
      console.error('App save error:', err);
      setFormError('تعذر حفظ التطبيق. يرجى المحاولة مرة أخرى.');
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (app: AppInfo) => {
    setEditingId(app.id);
    setForm({ name: app.name, details: app.details, packageName: app.packageName });
    setFormError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const handleDelete = async (app: AppInfo) => {
    if (!isAdmin) return;
    if (!window.confirm(`هل تريد حذف "${app.name}" من قائمة تطبيقاتنا؟`)) return;
    setDeletingId(app.id);
    try {
      await removeApp(app.id);
      if (editingId === app.id) cancelEdit();
    } catch (err) {
      console.error('App delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpen = async (app: AppInfo) => {
    setOpeningId(app.id);
    try {
      await openExternalApp(app.packageName);
    } catch (err) {
      console.error('Open app error:', err);
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-[#122820] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-800">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <Smartphone className="w-3.5 h-3.5 text-amber-300" />
            <span>صفحة تطبيقاتنا • تطبيقات المطور الحصرية</span>
          </div>
          <h1 className="font-cairo font-extrabold text-2xl sm:text-3xl text-white flex items-center gap-3">
            <AppWindow className="w-8 h-8 text-amber-300" />
            تطبيقاتنا
          </h1>
          <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
            اكتشف باقي تطبيقاتنا وخدماتنا. اضغط على أي تطبيق لفتحه مباشرة، وإن لم يكن مثبّتاً على هاتفك
            سيأخذك إلى صفحته على Google Play لتحميله مجاناً.
          </p>
          {!isNative && (
            <p className="text-[11px] text-amber-300/80 font-medium">
              هذه نسخة المتصفح: سيتم توجيهك إلى الصفحة على Google Play.
            </p>
          )}
        </div>
      </div>

      {/* Admin Management Panel */}
      {isAdmin && (
        <div className="bg-white rounded-3xl border border-emerald-200/80 shadow-sm overflow-hidden">
          <div className="bg-emerald-700 px-5 sm:px-6 py-4 text-white flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-300" />
            <div>
              <h2 className="font-cairo font-extrabold text-base">
                {editingId ? 'تعديل التطبيق' : 'إدارة تطبيقاتنا'}
              </h2>
              <p className="text-[11px] text-emerald-100 font-medium">
                أنت فقط من يستطيع الإضافة والتعديل والحذف — والجميع يرى النتيجة فوراً.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-cairo font-bold text-stone-700 mb-1.5">اسم التطبيق</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, name: e.target.value }));
                      setFormError(null);
                    }}
                    placeholder="مثال: منبر الخطيب الذكي"
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-cairo font-bold text-stone-700 mb-1.5">
                    اسم الحزمة <span dir="ltr" className="text-[10px] text-stone-400">(Package Name)</span>
                  </label>
                  <input
                    type="text"
                    value={form.packageName}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, packageName: e.target.value }));
                      setFormError(null);
                    }}
                    placeholder="com.example.app"
                    dir="ltr"
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm text-stone-800 text-left font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-cairo font-bold text-stone-700 mb-1.5">تفاصيل مختصرة</label>
                <textarea
                  value={form.details}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, details: e.target.value }));
                    setFormError(null);
                  }}
                  placeholder="وصف مختصر يوضح وظيفة التطبيق وفوائده..."
                  rows={2}
                  className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
                />
              </div>

              {formError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={busy}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-xl font-cairo font-bold text-sm shadow transition-all cursor-pointer active:scale-98"
                >
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Plus className="w-4 h-4" />
                  {editingId ? 'حفظ التعديلات' : 'إضافة التطبيق'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-cairo font-semibold text-xs transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    إلغاء التعديل
                  </button>
                )}
              </div>
            </form>

            {/* Manage existing */}
            {apps.length > 0 && (
              <div className="mt-6 border-t border-stone-100 pt-5 space-y-2.5">
                <h3 className="text-xs font-cairo font-bold text-stone-600 mb-3">
                  التطبيقات الحالية ({apps.length})
                </h3>
                {apps.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-cairo font-bold text-stone-800 truncate">{app.name}</div>
                      <div className="text-[11px] text-stone-500 font-mono truncate" dir="ltr">
                        {app.packageName}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEdit(app)}
                      className="p-2 text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      title="تعديل"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(app)}
                      disabled={deletingId === app.id}
                      className="p-2 text-stone-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      title="حذف"
                    >
                      {deletingId === app.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Public Apps Grid */}
      <section className="space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-700 text-amber-300 flex items-center justify-center shadow-sm">
            <AppWindow className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-cairo font-extrabold text-lg text-stone-900">قائمة التطبيقات</h2>
            <p className="text-[11px] text-stone-500 font-medium">
              {apps.length > 0 ? `${apps.length} تطبيق متاح الآن` : 'تُضاف التطبيقات الجديدة هنا'}
            </p>
          </div>
        </div>

        {!loaded ? (
          <div className="flex items-center justify-center py-16 text-stone-400 gap-2 text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>جاري تحميل التطبيقات...</span>
          </div>
        ) : apps.length === 0 ? (
          <div className="bg-white border border-dashed border-stone-300 rounded-3xl p-10 text-center">
            <Package className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500 text-sm font-medium">
              لا توجد تطبيقات مضافة بعد.
              {user && isAdmin ? ' أضف أول تطبيق من لوحة الإدارة أعلاه.' : ''}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => (
              <button
                key={app.id}
                type="button"
                onClick={() => handleOpen(app)}
                disabled={openingId === app.id}
                className="group text-right bg-white border border-stone-200 hover:border-emerald-500 hover:shadow-xl rounded-3xl p-5 transition-all duration-200 active:scale-[0.98] text-stone-900 cursor-pointer flex flex-col"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-amber-300 flex items-center justify-center shadow-md shadow-emerald-100 border border-emerald-500/30 shrink-0">
                    <Package className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-cairo font-extrabold text-base truncate">{app.name}</div>
                    <div className="text-[10px] text-stone-400 font-mono truncate" dir="ltr">
                      {app.packageName}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-stone-500 leading-relaxed flex-1 mb-4 line-clamp-3">
                  {app.details}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-cairo font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5 transition-all group-hover:bg-emerald-700 group-hover:text-white group-hover:border-emerald-700">
                    {openingId === app.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>فتح...</span>
                      </>
                    ) : isNative ? (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>فتح التطبيق</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>عرض في جرّوج بلاي</span>
                      </>
                    )}
                  </span>
                  <span className="text-[10px] text-stone-400 font-medium" dir="ltr">
                    Google Play
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AppsPage;