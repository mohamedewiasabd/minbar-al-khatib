import { Sermon, SeriesPart } from '../types';

export type ShareResult = 'shared' | 'copied' | 'failed';

/** نص مشاركة مختصر يصلح للواتساب ووسائل التواصل */
export function buildShareText(sermon: Sermon, part?: SeriesPart | null): string {
  const title = part ? `${sermon.title} — ${part.title}` : sermon.title;
  const points = (part ? part.mainPoints : sermon.mainPoints) || [];
  const highlights = points.slice(0, 3).map((p) => `• ${p}`).join('\n');
  const topic = sermon.topic ? `\nالموضوع: ${sermon.topic}` : '';
  return `📖 ${title}\n${topic}${highlights ? `\n\n${highlights}` : ''}\n\nمن تطبيق منبر الخطيب الذكي`;
}

/**
 * مشاركة الخطبة: تستخدم نافذة المشاركة الأصلية عند توفرها،
 * وتنسخ النص والرابط إلى الحافظة كبديل في المتصفحات التي لا تدعمها.
 */
export async function shareSermon(sermon: Sermon, part?: SeriesPart | null): Promise<ShareResult> {
  const text = buildShareText(sermon, part);
  const title = part ? `${sermon.title} - ${part.title}` : sermon.title;
  const url = window.location.origin;

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (err) {
      // إلغاء المستخدم للمشاركة ليس خطأً يستوجب نسخاً تلقائياً
      if ((err as DOMException)?.name === 'AbortError') return 'failed';
    }
  }

  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    return 'copied';
  } catch {
    return 'failed';
  }
}
