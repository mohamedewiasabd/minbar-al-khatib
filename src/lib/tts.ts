// =====================================================================
// قراءة الخطب بصوت عالٍ عبر Web Speech API (دون حاجة إلى مكتبات أصلية)
// =====================================================================

let active = false;
let queue: string[] = [];
let currentUtterance: SpeechSynthesisUtterance | null = null;

export const isSpeechSupported = (): boolean =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

/** تقسيم النص الطويل إلى مقاطع قصيرة لتفادي توقف محركات القراءة */
const chunkText = (text: string, maxLength = 1600): string[] => {
  const clean = text
    .replace(/\s+/g, ' ')
    .replace(/[﴿﴾«»]/g, ' ')
    .trim();
  if (!clean) return [];
  const chunks: string[] = [];
  let current = '';
  for (const word of clean.split(' ')) {
    if ((current + ' ' + word).trim().length > maxLength) {
      if (current) chunks.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
};

const pickArabicVoice = (): SpeechSynthesisVoice | undefined => {
  const voices = window.speechSynthesis.getVoices() || [];
  return (
    voices.find((v) => /^ar[-_]?/i.test(v.lang)) ||
    voices.find((v) => v.lang.toLowerCase().includes('arabic'))
  );
};

interface SpeakOptions {
  rate?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

/** إيقاف أي قراءة جارية */
export function stopSpeech(): void {
  active = false;
  queue = [];
  currentUtterance = null;
  if (isSpeechSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // تجاهل
    }
  }
}

/** قراءة نص (أو نص خطبة كامل) بصوت عربي إن توفر */
export function speakText(text: string, options: SpeakOptions = {}): boolean {
  if (!isSpeechSupported()) return false;
  stopSpeech();
  queue = chunkText(text);
  if (queue.length === 0) return false;
  active = true;
  options.onStart?.();

  const speakNext = () => {
    if (!active || queue.length === 0) {
      active = false;
      currentUtterance = null;
      options.onEnd?.();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(queue.shift() as string);
    const voice = pickArabicVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || 'ar-SA';
    utterance.rate = options.rate ?? 0.9;
    utterance.pitch = 1;
    utterance.onend = () => {
      if (active) speakNext();
    };
    utterance.onerror = () => {
      active = false;
      queue = [];
      options.onError?.();
    };
    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  };

  speakNext();
  return true;
}

export const isSpeaking = (): boolean => active && Boolean(currentUtterance);
