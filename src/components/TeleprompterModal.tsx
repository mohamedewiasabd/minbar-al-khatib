import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Moon,
  Sun,
  Type,
  Maximize2,
  Minimize2,
  Clock,
  ArrowDown,
  Volume2
} from 'lucide-react';
import { Sermon, SeriesPart } from '../types';

interface TeleprompterModalProps {
  sermon: Sermon;
  activePart?: SeriesPart | null;
  onClose: () => void;
}

export const TeleprompterModal: React.FC<TeleprompterModalProps> = ({
  sermon,
  activePart,
  onClose,
}) => {
  const currentTitle = activePart ? `${sermon.title || 'سلسلة خطب'} - ${activePart.title || ''}` : (sermon.title || 'خطبة الجمعة');
  const intro = (activePart ? activePart.intro : sermon.intro) || '';
  const firstKhutbah = (activePart ? activePart.firstKhutbah : sermon.firstKhutbah) || '';
  const pauseAdvice = (activePart ? activePart.pauseAdvice : sermon.pauseAdvice) || '(جلسة الاستراحة يسيراً بين الخطبتين)';
  const secondKhutbah = (activePart ? activePart.secondKhutbah : sermon.secondKhutbah) || '';
  const supplication = (activePart ? activePart.supplication : sermon.supplication) || '';

  const [fontSize, setFontSize] = useState<number>(32);
  const [isDark, setIsDark] = useState<boolean>(true);
  const [seconds, setSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(1);

  const contentRef = useRef<HTMLDivElement>(null);

  // Timer effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Auto-scroll effect
  useEffect(() => {
    let scrollInterval: any = null;
    if (autoScroll && contentRef.current) {
      scrollInterval = setInterval(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop += scrollSpeed;
        }
      }, 50);
    } else {
      clearInterval(scrollInterval);
    }
    return () => clearInterval(scrollInterval);
  }, [autoScroll, scrollSpeed]);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col transition-colors duration-300 ${
        isDark ? 'bg-stone-950 text-stone-100' : 'bg-stone-100 text-stone-900'
      }`}
    >
      {/* Top Floating Control Bar */}
      <div
        className={`px-4 sm:px-8 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 backdrop-blur-md sticky top-0 z-10 ${
          isDark
            ? 'bg-stone-900/90 border-stone-800'
            : 'bg-white/90 border-stone-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="font-cairo font-bold text-base sm:text-lg text-emerald-400">
            وضع المنبر والإلقاء
          </span>
          <span className="text-xs opacity-60 hidden sm:inline-block">
            {currentTitle}
          </span>
        </div>

        {/* Stopwatch & Delivery Timer */}
        <div className="flex items-center gap-2 bg-stone-800/80 text-white px-3 py-1.5 rounded-xl border border-stone-700">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="font-mono font-bold text-base tracking-wider">
            {formatTime(seconds)}
          </span>
          <button
            type="button"
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className="p-1 hover:bg-stone-700 rounded-lg text-stone-200 transition-colors"
            title={isTimerRunning ? 'إيقاف مؤقت' : 'بدء المؤقت'}
          >
            {isTimerRunning ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsTimerRunning(false);
              setSeconds(0);
            }}
            className="p-1 hover:bg-stone-700 rounded-lg text-stone-400 hover:text-white transition-colors"
            title="تصفير المؤقت"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Font Size & Auto Scroll & Theme Controls */}
        <div className="flex items-center gap-2">
          {/* Font Size controls */}
          <div className="flex items-center gap-1 bg-stone-800/60 px-2 py-1 rounded-lg text-xs">
            <Type className="w-3.5 h-3.5 text-stone-400" />
            <button
              onClick={() => setFontSize((s) => Math.max(20, s - 3))}
              className="px-1.5 py-0.5 hover:bg-stone-700 rounded font-bold"
            >
              -
            </button>
            <span className="w-6 text-center font-mono">{fontSize}</span>
            <button
              onClick={() => setFontSize((s) => Math.min(56, s + 3))}
              className="px-1.5 py-0.5 hover:bg-stone-700 rounded font-bold"
            >
              +
            </button>
          </div>

          {/* Auto Scroll Toggle */}
          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              autoScroll
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
            title="التمرير التلقائي أثناء الوقوف على المنبر"
          >
            <ArrowDown className={`w-3.5 h-3.5 ${autoScroll ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">تمرير آلي</span>
          </button>

          {/* Day / Night Theme */}
          <button
            type="button"
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-lg bg-stone-800 text-stone-300 hover:text-white transition-colors"
            title="تبديل النمط المظلم / المضيء"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-stone-700" />}
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-red-900/40 hover:bg-red-800/80 text-red-200 transition-colors"
            title="إغلاق وضع المنبر"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Delivery Scrollable Area */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto px-6 sm:px-16 md:px-24 lg:px-36 py-12 select-text"
        style={{ fontSize: `${fontSize}px` }}
      >
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Preacher Header Frame */}
          <div className="text-center pb-6 border-b border-stone-800/60">
            <div className="text-emerald-400 font-amiri font-bold text-2xl mb-2">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
            <h1 className="font-cairo font-bold text-3xl sm:text-4xl text-amber-300">
              {currentTitle}
            </h1>
          </div>

          {/* Introduction Section */}
          <section className="space-y-4">
            <div className="text-sm font-cairo font-bold text-emerald-400 uppercase tracking-wider">
              [المقدمة وخطبة الحاجة]
            </div>
            <div className="font-amiri leading-[2.1] text-justify space-y-4">
              {(intro || '').split('\n\n').filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>

          {/* First Sermon Section */}
          <section className="space-y-4">
            <div className="text-sm font-cairo font-bold text-emerald-400 uppercase tracking-wider">
              [صلب الخطبة الأولى]
            </div>
            <div className="font-amiri leading-[2.1] text-justify space-y-4">
              {(firstKhutbah || '').split('\n\n').filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>

          {/* Intermission Pause */}
          <div className="my-8 py-5 px-6 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-center">
            <p className="font-cairo font-bold text-amber-300 text-lg sm:text-xl">
              {pauseAdvice}
            </p>
          </div>

          {/* Second Sermon Section */}
          <section className="space-y-4">
            <div className="text-sm font-cairo font-bold text-emerald-400 uppercase tracking-wider">
              [الخطبة الثانية والوصايا]
            </div>
            <div className="font-amiri leading-[2.1] text-justify space-y-4">
              {(secondKhutbah || '').split('\n\n').filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>

          {/* Supplication Section */}
          <section className="space-y-4 pb-20">
            <div className="text-sm font-cairo font-bold text-emerald-400 uppercase tracking-wider">
              [الدعاء والختام]
            </div>
            <div className="font-amiri leading-[2.1] text-justify space-y-4 text-emerald-300">
              {(supplication || '').split('\n\n').filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>

        </div>
      </div>

    </div>
  );
};
