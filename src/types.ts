export type SermonLength = 'short' | 'medium' | 'long';
export type SermonComplexity = 'simple' | 'moderate' | 'eloquent';
export type SermonTone = 'exhortative' | 'guidance' | 'foundational' | 'inspirational';
export type SermonDialect = 'msa' | 'egyptian' | 'levantine' | 'gulf' | 'iraqi' | 'maghreb' | 'yemeni' | 'sudanese';
export type GeneratorMode = 'topic' | 'document' | 'book_series';

export interface QuranCitation {
  verse: string;
  surah: string;
  ayahNumber?: string;
}

export interface HadithCitation {
  hadith: string;
  source: string;
  grade?: string;
}

export interface SeriesPart {
  partNumber: number;
  title: string;
  summary: string;
  intro: string;
  firstKhutbah: string;
  pauseAdvice: string;
  secondKhutbah: string;
  supplication: string;
  fullText: string;
  mainPoints: string[];
  quranCitations: QuranCitation[];
  hadithCitations: HadithCitation[];
  estimatedMinutes: number;
  wordCount: number;
}

export interface Sermon {
  id: string;
  title: string;
  topic: string;
  mode: GeneratorMode;
  dialect?: SermonDialect;
  length: SermonLength;
  complexity: SermonComplexity;
  tone: SermonTone;
  isSeries: boolean;
  totalSeriesParts?: number;
  currentSeriesPartIndex?: number;
  seriesParts?: SeriesPart[];
  
  // For single khutbah or currently active part:
  intro: string;
  firstKhutbah: string;
  pauseAdvice: string;
  secondKhutbah: string;
  supplication: string;
  fullText: string;
  
  mainPoints: string[];
  quranCitations: QuranCitation[];
  hadithCitations: HadithCitation[];
  
  estimatedMinutes: number;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  notes?: string;
  category?: string;
  downloadsCount?: number;
  viewsCount?: number;
}

export interface GenerateRequest {
  mode: GeneratorMode;
  topic?: string;
  category?: string;
  dialect?: SermonDialect;
  fileText?: string;
  fileMimeType?: string;
  fileBase64?: string;
  fileName?: string;
  length: SermonLength;
  complexity: SermonComplexity;
  tone: SermonTone;
  isSeries: boolean;
  seriesPartsCount?: number;
  customInstructions?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  points: number;
  totalEarned: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface PointTransaction {
  id: string;
  type: 'earn' | 'spend';
  amount: number;
  reason: string;
  createdAt: string;
}

export interface AppInfo {
  id: string;
  name: string;
  details: string;
  packageName: string;
  createdAt: string;
  updatedAt?: string;
}
