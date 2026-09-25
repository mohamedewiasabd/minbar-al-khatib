import { parseDocxOnServer } from '../services/api';

export interface ProcessedFile {
  name: string;
  size: number;
  type: string;
  text?: string;
  base64?: string;
  mimeType?: string;
  charCount?: number;
  wordCount?: number;
}

export async function processUploadedFile(file: File): Promise<ProcessedFile> {
  const extension = (file?.name || '').split('.').pop()?.toLowerCase() || '';

  // 1. PDF File
  if (extension === 'pdf' || file.type === 'application/pdf') {
    const base64 = await fileToBase64(file);
    // Remove data URL prefix
    const rawBase64 = base64.replace(/^data:[^;]+;base64,/, '');
    return {
      name: file.name,
      size: file.size,
      type: 'pdf',
      base64: rawBase64,
      mimeType: 'application/pdf',
      text: `[تم تجهيز ملف PDF: ${file.name} بحجم ${(file.size / 1024).toFixed(1)} ك.ب. سيقوم الذكاء الاصطناعي بتحليله واستخلاص الخطبة منه مباشرة]`,
    };
  }

  // 2. Word (DOCX)
  if (extension === 'docx' || file.type.includes('wordprocessingml')) {
    const base64 = await fileToBase64(file);
    const rawBase64 = base64.replace(/^data:[^;]+;base64,/, '');
    const extractedText = await parseDocxOnServer(rawBase64);
    const words = (extractedText || '').split(/\s+/).filter(Boolean).length;
    return {
      name: file.name,
      size: file.size,
      type: 'docx',
      text: extractedText || '',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      charCount: (extractedText || '').length,
      wordCount: words,
    };
  }

  // 3. Text, Markdown, HTML
  if (['txt', 'md', 'html', 'htm'].includes(extension) || file.type.startsWith('text/')) {
    const textContent = await fileToText(file);
    let cleanText = textContent || '';
    
    // If HTML, strip basic tags for cleaner extraction
    if (extension === 'html' || extension === 'htm' || file.type.includes('html')) {
      const doc = new DOMParser().parseFromString(textContent, 'text/html');
      cleanText = doc.body.textContent || textContent || '';
    }

    const words = (cleanText || '').split(/\s+/).filter(Boolean).length;
    return {
      name: file.name,
      size: file.size,
      type: extension || 'txt',
      text: cleanText,
      mimeType: file.type || 'text/plain',
      charCount: cleanText.length,
      wordCount: words,
    };
  }

  // Fallback try reading as text
  try {
    const fallbackText = (await fileToText(file)) || '';
    return {
      name: file.name,
      size: file.size,
      type: extension || 'file',
      text: fallbackText,
      mimeType: file.type || 'text/plain',
      wordCount: (fallbackText || '').split(/\s+/).filter(Boolean).length,
    };
  } catch (err) {
    throw new Error(`نوع الملف (${extension || file.type}) غير مدعوم. يرجى رفع ملفات PDF, DOCX, TXT, MD, أو HTML.`);
  }
}

function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('فشل قراءة الملف النصي'));
    reader.readAsText(file, 'utf-8');
  });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('فشل ترميز الملف'));
    reader.readAsDataURL(file);
  });
}
