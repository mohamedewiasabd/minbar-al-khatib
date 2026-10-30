import React, { useState } from 'react';
import {
  ArrowRight,
  Phone,
  Mail,
  Heart,
  Copy,
  Check,
  Code2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { APP_NAME, APP_VERSION, DEVELOPER } from '../lib/appMeta';

interface DeveloperPageProps {
  onBack: () => void;
}

const CopyButton: React.FC<{ value: string }> = ({ value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // المتصفح قد يمنع النسخ — تجاهل بهدوء
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="نسخ"
      aria-label="نسخ الرقم"
      className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-stone-300 bg-white text-stone-500 hover:text-emerald-700 hover:border-emerald-400 transition-all active:scale-95 cursor-pointer shrink-0"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
};

const DeveloperPage: React.FC<DeveloperPageProps> = ({ onBack }) => {
  return (
    <div className="space-y-6">
      {/* زر العودة */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-cairo font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
      >
        <ArrowRight className="w-4 h-4" />
        <span>العودة إلى تطبيقاتنا</span>
      </button>

      <div className="max-w-2xl mx-auto space-y-5">
        {/* بطاقة المطور */}
        <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-amber-300 flex items-center justify-center text-2xl font-cairo font-bold shadow-md border border-emerald-500/30 shrink-0">
              {DEVELOPER.initials}
            </div>
            <div className="min-w-0">
              <h1 className="font-cairo font-extrabold text-xl sm:text-2xl text-emerald-800">
                {DEVELOPER.name}
              </h1>
              <p className="text-xs text-stone-500 font-medium">{DEVELOPER.title}</p>
              <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                <ShieldCheck className="w-3 h-3" />
                مطوّر معتمد — تطبيقات موثوقة
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm leading-relaxed text-stone-700">
            <p>
              مطور برامج وتطبيقات متخصّص في بناء حلول رقمية عربية (ويب، أندرويد، سطح مكتب) تخدم
              المستخدم العربي. أعمل على تطوير تطبيقات إسلامية وتعليمية وإدارية بتجربة استخدام
              نظيفة ودعم كامل للغة العربية (RTL) وللعمل دون اتصال عندما يكون ذلك ممكناً.
            </p>
            <p>
              هذا التطبيق ({APP_NAME}) هو أحد مشاريعي الرئيسية: مولّد لخطب الجمعة يعتمد على الذكاء
              الاصطناعي ليصوغ خطبة كاملة بأقسامها (افتتاح، موضوعات، خاتمة، دعاء) مع أقسام جاهزة
              ولوحة إنتاج منبري وإحصائيات، لخدمة الخطيب والداعية في تحضير خطبته.
            </p>
          </div>

          {/* التواصل */}
          <div className="rounded-2xl border border-stone-200 p-4 space-y-3">
            <h2 className="font-cairo font-bold text-base text-emerald-800 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              التواصل
            </h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 flex-wrap">
                <span className="text-stone-500">الهاتف / واتساب:</span>
                <a
                  dir="ltr"
                  href={`tel:${DEVELOPER.phone}`}
                  className="font-mono text-emerald-700 hover:underline"
                >
                  {DEVELOPER.phone}
                </a>
                <CopyButton value={DEVELOPER.phone} />
              </li>
              <li className="flex items-center gap-2 flex-wrap">
                <span className="text-stone-500">البريد:</span>
                <a
                  href={`mailto:${DEVELOPER.email}`}
                  className="text-emerald-700 hover:underline break-all"
                  dir="ltr"
                >
                  {DEVELOPER.email}
                </a>
              </li>
            </ul>
          </div>

          {/* التبرع */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
            <h2 className="font-cairo font-bold text-base text-amber-800 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              التبرع ودعم المطور
            </h2>
            <p className="text-sm text-stone-700">
              إذا أفادك هذا التطبيق وترغبت في دعم استمرار التطوير، يمكنك التبرع عبر:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 flex-wrap">
                <span className="text-stone-500">كاش (Cash):</span>
                <span dir="ltr" className="font-mono text-stone-800">
                  {DEVELOPER.phone}
                </span>
                <CopyButton value={DEVELOPER.phone} />
              </li>
              <li className="flex items-center gap-2 flex-wrap">
                <span className="text-stone-500">InstaPay:</span>
                <span dir="ltr" className="font-mono text-stone-800">
                  {DEVELOPER.phone}
                </span>
                <CopyButton value={DEVELOPER.phone} />
              </li>
            </ul>
            <p className="text-xs text-stone-500">جزاك الله خيراً على دعمك.</p>
          </div>

          {/* تذييل الإصدار */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-400 pt-2 border-t border-stone-100">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {APP_NAME}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5" />
              الإصدار: <span dir="ltr" className="font-mono">{APP_VERSION}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperPage;
