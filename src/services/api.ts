import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { apiUrl, isServerConfigured } from '../lib/apiBase';
import { generateKhutbahDirect, parseDocxLocally } from '../lib/geminiClient';
import { Sermon, GenerateRequest } from '../types';

const SERMONS_COLLECTION = 'sermons';

// Helper to remove any undefined fields before saving to Firestore
function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = sanitizeForFirestore(value);
    }
  }
  return result;
}

/**
 * Fetch all sermons from Firebase Firestore
 */
export async function fetchSermons(): Promise<Sermon[]> {
  const sermonsRef = collection(db, SERMONS_COLLECTION);
  const q = query(sermonsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Sermon[];
}

/**
 * Real-time listener for sermons from Firebase Firestore
 */
export function subscribeToSermons(callback: (sermons: Sermon[]) => void): () => void {
  try {
    const sermonsRef = collection(db, SERMONS_COLLECTION);
    const q = query(sermonsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const sermons = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Sermon[];
        callback(sermons);
      },
      (error) => {
        console.error('Firestore subscription error:', error);
      }
    );
  } catch (err) {
    console.error('Failed to setup Firestore listener:', err);
    return () => {};
  }
}

/**
 * Save or update a sermon to Firebase Firestore
 */
export async function saveSermonToCloud(sermon: Sermon): Promise<Sermon> {
  const id = sermon.id || `sermon-${Date.now()}`;
  const now = new Date().toISOString();
  const updatedSermon: Sermon = {
    ...sermon,
    id,
    updatedAt: now,
    createdAt: sermon.createdAt || now,
  };

  const sermonDocRef = doc(db, SERMONS_COLLECTION, id);
  const cleanData = sanitizeForFirestore(updatedSermon);
  await setDoc(sermonDocRef, cleanData, { merge: true });

  return updatedSermon;
}

/**
 * Delete a sermon from Firebase Firestore
 */
export async function deleteSermonFromCloud(id: string): Promise<boolean> {
  const sermonDocRef = doc(db, SERMONS_COLLECTION, id);
  await deleteDoc(sermonDocRef);
  return true;
}

/**
 * Generate a khutbah and save it to Firestore.
 * - إذا وُجد رابط سيرفر (VITE_API_URL) يُستخدم التوليد عبر السيرفر (بديل رئيسي).
 * - إذا لم يوجد يعمل التوليد مباشرة بالتطبيق عبر مفتاح Gemini الافتراضي.
 */
export async function generateKhutbahApi(request: GenerateRequest): Promise<Sermon> {
  let generatedSermon: Sermon;

  if (isServerConfigured()) {
    const res = await fetch(apiUrl('/api/generate-khutbah'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'حدث خطأ أثناء توليد الخطبة بالذكاء الاصطناعي');
    }

    const data = await res.json();
    generatedSermon = {
      ...data.sermon,
      category: request.category || data.sermon?.category || (request.isSeries ? 'سلاسل منبرية متكاملة' : 'العقيدة والإيمان'),
    };
  } else {
    // التوليد المباشر داخل التطبيق (افتراضي يضمن عمل التطبيق بدون سيرفر)
    generatedSermon = await generateKhutbahDirect(request);
  }

  // Save to Firestore
  await saveSermonToCloud(generatedSermon);

  return generatedSermon;
}

/**
 * Parse docx: عبر السيرفر إن وُجد، وإلا محلياً داخل التطبيق
 */
export async function parseDocxOnServer(base64Data: string): Promise<string> {
  if (isServerConfigured()) {
    const res = await fetch(apiUrl('/api/parse-docx'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Data }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'فشل في قراءة ملف Word');
    }

    const data = await res.json();
    return data.text;
  }

  return parseDocxLocally(base64Data);
}

/**
 * Increment downloads or views count for a sermon in Firestore
 */
export async function trackSermonStat(
  sermonId: string,
  type: 'downloads' | 'views' | 'download' | 'view'
): Promise<{ downloadsCount: number; viewsCount: number } | null> {
  const normalizedType = type.startsWith('download') ? 'downloads' : 'views';
  const field = normalizedType === 'downloads' ? 'downloadsCount' : 'viewsCount';

  const sermonDocRef = doc(db, SERMONS_COLLECTION, sermonId);
  const snap = await getDoc(sermonDocRef);

  if (snap.exists()) {
    const data = snap.data();
    const currentVal = Number(data[field] || 0);
    const newVal = currentVal + 1;
    await updateDoc(sermonDocRef, {
      [field]: newVal,
    });

    return {
      downloadsCount: type === 'downloads' ? newVal : Number(data.downloadsCount || 0),
      viewsCount: type === 'views' ? newVal : Number(data.viewsCount || 0),
    };
  }

  return null;
}
