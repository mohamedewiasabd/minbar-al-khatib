import { Sermon, SeriesPart } from '../types';

interface NativeSaveFilePlugin {
  save: (options: { base64: string; fileName: string; mime: string }) => Promise<{ path: string }>;
}

function getNativeSavePlugin(): NativeSaveFilePlugin {
  const cap = (globalThis as any).Capacitor;
  return cap?.Plugins?.SaveFile as NativeSaveFilePlugin | undefined;
}

export async function exportAsText(sermon: Sermon, activePart?: SeriesPart | null): Promise<string | null> {
  const content = formatSermonAsPlainText(sermon, activePart);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  return downloadBlob(blob, `${sanitizeFileName(sermon.title)}.txt`);
}

export async function exportAsMarkdown(sermon: Sermon, activePart?: SeriesPart | null): Promise<string | null> {
  const content = formatSermonAsMarkdown(sermon, activePart);
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  return downloadBlob(blob, `${sanitizeFileName(sermon.title)}.md`);
}

export async function exportAsWordDoc(sermon: Sermon, activePart?: SeriesPart | null): Promise<string | null> {
  const currentTitle = activePart ? `${sermon.title || 'سلسلة خطب'} - ${activePart.title || ''}` : (sermon.title || 'خطبة الجمعة');
  const intro = (activePart ? activePart.intro : sermon.intro) || '';
  const first = (activePart ? activePart.firstKhutbah : sermon.firstKhutbah) || '';
  const pause = (activePart ? activePart.pauseAdvice : sermon.pauseAdvice) || '(جلسة الاستراحة بين الخطبتين)';
  const second = (activePart ? activePart.secondKhutbah : sermon.secondKhutbah) || '';
  const supp = (activePart ? activePart.supplication : sermon.supplication) || '';
  const points = (activePart ? activePart.mainPoints : sermon.mainPoints) || [];

  const htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${escapeHtml(currentTitle)}</title>
<style>
  body {
    font-family: 'Traditional Arabic', 'Amiri', 'Arial', sans-serif;
    direction: rtl;
    text-align: justify;
    line-height: 1.8;
    font-size: 16pt;
    margin: 2cm;
    color: #1a1a1a;
  }
  h1 {
    text-align: center;
    color: #064e3b;
    font-size: 24pt;
    border-bottom: 2pt solid #047857;
    padding-bottom: 12pt;
    margin-bottom: 18pt;
  }
  .basmalah {
    text-align: center;
    font-size: 20pt;
    color: #064e3b;
    margin-bottom: 20pt;
    font-weight: bold;
  }
  .section-title {
    font-size: 18pt;
    font-weight: bold;
    color: #047857;
    margin-top: 24pt;
    margin-bottom: 8pt;
    border-right: 4pt solid #047857;
    padding-right: 8pt;
  }
  .pause-box {
    text-align: center;
    font-style: italic;
    background-color: #f3f4f6;
    padding: 10pt;
    margin: 18pt 0;
    border-radius: 4pt;
    color: #4b5563;
    font-size: 14pt;
  }
  .points-box {
    background-color: #f0fdf4;
    border: 1pt solid #bbf7d0;
    padding: 12pt;
    margin: 16pt 0;
    border-radius: 6pt;
  }
  .points-box ul {
    margin: 6pt 0;
    padding-right: 20pt;
  }
  p {
    margin-bottom: 12pt;
    text-indent: 1cm;
  }
</style>
</head>
<body>
  <div class="basmalah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
  <h1>${escapeHtml(currentTitle)}</h1>

  ${points && points.length > 0 ? `
    <div class="points-box">
      <strong>عناصر ومحاور الخطبة الرئيسية:</strong>
      <ul>
        ${points.map(pt => `<li>${escapeHtml(pt)}</li>`).join('')}
      </ul>
    </div>
  ` : ''}

  <div class="section-title">المقدمة وخطبة الحاجة</div>
  ${(intro || '').split('\n\n').filter(Boolean).map(p => `<p>${escapeHtml(p)}</p>`).join('')}

  <div class="section-title">صلب الخطبة الأولى</div>
  ${(first || '').split('\n\n').filter(Boolean).map(p => `<p>${escapeHtml(p)}</p>`).join('')}

  <div class="pause-box">${escapeHtml(pause)}</div>

  <div class="section-title">الخطبة الثانية</div>
  ${(second || '').split('\n\n').filter(Boolean).map(p => `<p>${escapeHtml(p)}</p>`).join('')}

  <div class="section-title">الدعاء والختام</div>
  ${(supp || '').split('\n\n').filter(Boolean).map(p => `<p>${escapeHtml(p)}</p>`).join('')}
</body>
</html>
  `;

  const blob = new Blob(['\ufeff' + htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
  return downloadBlob(blob, `${sanitizeFileName(currentTitle)}.doc`);
}

export function triggerPrintWindow(sermon: Sermon, activePart?: SeriesPart | null): void {
  const currentTitle = activePart ? `${sermon.title || 'سلسلة خطب'} - ${activePart.title || ''}` : (sermon.title || 'خطبة الجمعة');
  const intro = (activePart ? activePart.intro : sermon.intro) || '';
  const first = (activePart ? activePart.firstKhutbah : sermon.firstKhutbah) || '';
  const pause = (activePart ? activePart.pauseAdvice : sermon.pauseAdvice) || '(جلسة الاستراحة بين الخطبتين)';
  const second = (activePart ? activePart.secondKhutbah : sermon.secondKhutbah) || '';
  const supp = (activePart ? activePart.supplication : sermon.supplication) || '';
  const points = (activePart ? activePart.mainPoints : sermon.mainPoints) || [];

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لطباعة الخطبة');
    return;
  }

  printWindow.document.write(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(currentTitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 20mm 15mm;
    }
    body {
      font-family: 'Amiri', 'Traditional Arabic', serif;
      direction: rtl;
      line-height: 1.8;
      font-size: 16pt;
      color: #1c1917;
      background: #ffffff;
      padding: 10px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    .header-frame {
      border: 2px solid #064e3b;
      padding: 15px;
      text-align: center;
      margin-bottom: 25px;
      border-radius: 8px;
    }
    .basmalah {
      font-size: 22pt;
      font-weight: bold;
      color: #064e3b;
      margin-bottom: 8px;
    }
    .title {
      font-family: 'Cairo', sans-serif;
      font-size: 22pt;
      font-weight: 700;
      color: #064e3b;
      margin: 5px 0;
    }
    .meta-info {
      font-size: 12pt;
      color: #78716c;
      margin-top: 6px;
    }
    .section-head {
      font-family: 'Cairo', sans-serif;
      font-size: 16pt;
      font-weight: 700;
      color: #047857;
      border-bottom: 1.5px solid #d1fae5;
      padding-bottom: 4px;
      margin-top: 25px;
      margin-bottom: 12px;
    }
    .pause {
      text-align: center;
      font-style: italic;
      color: #4b5563;
      padding: 10px;
      margin: 20px 0;
      border: 1px dashed #9ca3af;
      border-radius: 6px;
      font-size: 14pt;
    }
    .points-list {
      background: #fdfbf7;
      border: 1px solid #e7e5e4;
      padding: 12px 25px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 14pt;
    }
    p {
      margin-bottom: 14px;
      text-align: justify;
      text-indent: 20px;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-frame">
      <div class="basmalah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
      <h1 class="title">${escapeHtml(currentTitle)}</h1>
      <div class="meta-info">زمن الإلقاء المقدر: ${sermon.estimatedMinutes} دقيقة | إعداد: مولد خطب الجمعة الذكي</div>
    </div>

    ${points && points.length > 0 ? `
      <div class="points-list">
        <strong>محاور الخطبة:</strong>
        <ul>
          ${points.map(p => `<li>${escapeHtml(p)}</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    <div class="section-head">المقدمة وخطبة الحاجة</div>
    ${(intro || '').split('\n\n').filter(Boolean).map(p => `<p>${escapeHtml(p)}</p>`).join('')}

    <div class="section-head">الخطبة الأولى</div>
    ${(first || '').split('\n\n').filter(Boolean).map(p => `<p>${escapeHtml(p)}</p>`).join('')}

    <div class="pause">${escapeHtml(pause)}</div>

    <div class="section-head">الخطبة الثانية</div>
    ${(second || '').split('\n\n').filter(Boolean).map(p => `<p>${escapeHtml(p)}</p>`).join('')}

    <div class="section-head">الدعاء والختام</div>
    ${(supp || '').split('\n\n').filter(Boolean).map(p => `<p>${escapeHtml(p)}</p>`).join('')}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    }
  </script>
</body>
</html>
  `);
  printWindow.document.close();
}

function formatSermonAsPlainText(sermon: Sermon, activePart?: SeriesPart | null): string {
  const currentTitle = activePart ? `${sermon.title || 'سلسلة خطب'} - ${activePart.title || ''}` : (sermon.title || 'خطبة الجمعة');
  const intro = (activePart ? activePart.intro : sermon.intro) || '';
  const first = (activePart ? activePart.firstKhutbah : sermon.firstKhutbah) || '';
  const pause = (activePart ? activePart.pauseAdvice : sermon.pauseAdvice) || '(جلسة الاستراحة بين الخطبتين)';
  const second = (activePart ? activePart.secondKhutbah : sermon.secondKhutbah) || '';
  const supp = (activePart ? activePart.supplication : sermon.supplication) || '';
  const points = (activePart ? activePart.mainPoints : sermon.mainPoints) || [];

  let out = `بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\n\n`;
  out += `عنوان الخطبة: ${currentTitle}\n`;
  out += `زمن الإلقاء المقدر: حوالي ${sermon.estimatedMinutes || 15} دقيقة\n`;
  out += `==============================================\n\n`;

  if (points && points.length > 0) {
    out += `[محاور الخطبة الرئيسية]:\n`;
    points.forEach((pt, i) => {
      out += `${i + 1}. ${pt}\n`;
    });
    out += `\n----------------------------------------------\n\n`;
  }

  out += `[المقدمة وخطبة الحاجة]:\n${intro}\n\n`;
  out += `[صلب الخطبة الأولى]:\n${first}\n\n`;
  out += `[جلسة الاستراحة]:\n${pause}\n\n`;
  out += `[الخطبة الثانية والوصايا]:\n${second}\n\n`;
  out += `[الدعاء والختام]:\n${supp}\n`;

  return out;
}

function formatSermonAsMarkdown(sermon: Sermon, activePart?: SeriesPart | null): string {
  const currentTitle = activePart ? `${sermon.title || 'سلسلة خطب'} - ${activePart.title || ''}` : (sermon.title || 'خطبة الجمعة');
  const intro = (activePart ? activePart.intro : sermon.intro) || '';
  const first = (activePart ? activePart.firstKhutbah : sermon.firstKhutbah) || '';
  const pause = (activePart ? activePart.pauseAdvice : sermon.pauseAdvice) || '(جلسة الاستراحة بين الخطبتين)';
  const second = (activePart ? activePart.secondKhutbah : sermon.secondKhutbah) || '';
  const supp = (activePart ? activePart.supplication : sermon.supplication) || '';
  const points = (activePart ? activePart.mainPoints : sermon.mainPoints) || [];

  let md = `# ${currentTitle}\n\n`;
  md += `> **زمن الإلقاء المقدر:** ${sermon.estimatedMinutes || 15} دقيقة | **عدد الكلمات:** ${sermon.wordCount || 0}\n\n`;

  if (points && points.length > 0) {
    md += `### محاور الخطبة الرئيسية\n`;
    points.forEach(pt => {
      md += `- ${pt}\n`;
    });
    md += `\n---\n\n`;
  }

  md += `## المقدمة وخطبة الحاجة\n\n${intro}\n\n`;
  md += `## الخطبة الأولى\n\n${first}\n\n`;
  md += `> *${pause}*\n\n`;
  md += `## الخطبة الثانية\n\n${second}\n\n`;
  md += `## الدعاء والختام\n\n${supp}\n`;

  return md;
}

function downloadBlob(blob: Blob, filename: string): Promise<string | null> {
  const native = getNativeSavePlugin();
  if (native) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        native
          .save({ base64, fileName: filename, mime: blob.type || 'application/octet-stream' })
          .then(({ path }) => resolve(path))
          .catch(() => {
            webDownload(blob, filename);
            resolve('web');
          });
      };
      reader.onerror = () => {
        webDownload(blob, filename);
        resolve('web');
      };
      reader.readAsDataURL(blob);
    });
  }

  webDownload(blob, filename);
  return Promise.resolve('web');
}

function webDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sanitizeFileName(name: string): string {
  return (name || 'sermon').replace(/[\\/:*?"<>|]/g, '_').slice(0, 60);
}

function escapeHtml(text?: string): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
