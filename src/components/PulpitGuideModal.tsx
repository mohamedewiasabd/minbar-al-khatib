import React from 'react';
import { X, BookOpen, Sparkles, CheckCircle2, ShieldAlert, HeartHandshake, Mic } from 'lucide-react';

interface PulpitGuideModalProps {
  onClose: () => void;
}

export const PulpitGuideModal: React.FC<PulpitGuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-stone-200">
        
        {/* Header */}
        <div className="bg-emerald-900 text-white p-5 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800 rounded-xl text-amber-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cairo font-bold text-lg">دليل الخطيب المنبري والبلاغي</h3>
              <p className="text-xs text-emerald-200">أركان الخطبة، سنن الإلقاء، ومهارات التأثير في المصلين</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-emerald-800 rounded-lg text-emerald-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm text-stone-700 leading-relaxed">
          
          {/* Section 1: Pillars of Khutbah */}
          <section className="space-y-3">
            <h4 className="font-cairo font-bold text-base text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>أركان وسنن خطبة الجمعة الشرعية:</span>
            </h4>
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-2 text-xs sm:text-sm">
              <p>• <strong>حمد الله تعالى:</strong> والبدء بخطبة الحاجة المسنونة ("إن الحمد لله نحمده ونستعينه...").</p>
              <p>• <strong>الصلاة على النبي ﷺ:</strong> في الخطبتين الأولى والثانية.</p>
              <p>• <strong>الوصية بتقوى الله:</strong> وهي لب الخطبة ومقصد التذكير (مثل: "اتقوا الله حق تقاته").</p>
              <p>• <strong>قراءة آية من كتاب الله:</strong> تامة المعنى يستدل بها الخطيب في موضوعه.</p>
              <p>• <strong>الدعاء للمؤمنين والمسلمين:</strong> في الخطبة الثانية بصلاح دينهم ودنياهم وحفظ بلادهم.</p>
            </div>
          </section>

          {/* Section 2: Rhetoric & Delivery Tips */}
          <section className="space-y-3">
            <h4 className="font-cairo font-bold text-base text-emerald-900 flex items-center gap-2">
              <Mic className="w-4 h-4 text-emerald-600" />
              <span>مهارات الإلقاء المنبري والتأثير البلاغي:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-1">
                <span className="font-bold text-stone-900 block">تلوين نبرات الصوت:</span>
                <p className="text-stone-600">تنويع الصوت بين الترغيب والترهيب، والهدوء عند التأمل والرفع عند الحماسة.</p>
              </div>
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-1">
                <span className="font-bold text-stone-900 block">الوقفات التأملية (السكتات):</span>
                <p className="text-stone-600">السكوت لثانية أو ثانيتين بعد طرح التساؤل أو تلاوة الآية يرسخ المعنى في نفوس الحاضرين.</p>
              </div>
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-1">
                <span className="font-bold text-stone-900 block">الاتصال البصري الشامل:</span>
                <p className="text-stone-600">توزيع النظرات بين المصلين يميناً وشمالاً ووسطاً ليشعر كل فرد بالخطاب الموجه إليه.</p>
              </div>
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-1">
                <span className="font-bold text-stone-900 block">قصر الخطبة وطول الصلاة:</span>
                <p className="text-stone-600">من فقه الإمام إيجاز الخطبة وتركيزها حول فكرة محددة لا تشتت أذهان المصلين.</p>
              </div>
            </div>
          </section>

          {/* Section 3: Series Guidelines */}
          <section className="space-y-2 bg-amber-50/70 p-4 rounded-xl border border-amber-200">
            <h4 className="font-cairo font-bold text-sm text-amber-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>نصيحة إلقاء السلاسل الخطبية:</span>
            </h4>
            <p className="text-xs text-amber-900/90 leading-relaxed">
              عند إلقاء سلسلة مستخلصة من كتاب أو موضوع مطول، ذكّر المصلين في استهلال الخطبة برابط سريع بما ورد في الجمعة الماضية، واختم بتشويق موجز لما سيتناوله الجزء القادم لضمان تفاعل المصلين وارتباطهم بالسلسلة.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="bg-stone-50 p-4 px-6 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors"
          >
            إغلاق الدليل
          </button>
        </div>

      </div>
    </div>
  );
};
