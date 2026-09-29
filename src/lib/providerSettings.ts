// =====================================================================
// إعدادات مزوّدات الذكاء الاصطناعي في Firestore
// - userSettings/{uid}: إعداد المستخدم الشخصي (المالك وحده)
// - adminSettings/global: المفتاح العام/الافتراضي الذي تحدده الإدارة
// الدقة: إعداد المستخدم ← إعداد الإدارة ← المفتاح المدمج.
// =====================================================================
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { ProviderCallSettings, BUILTIN_DEFAULT, getProvider } from './providers';

export interface ProviderSettings extends ProviderCallSettings {
  displayName?: string;
  updatedAt?: string;
}

export type EffectiveSource = 'user' | 'admin' | 'builtin';

export interface EffectiveProviderSettings extends ProviderSettings {
  source: EffectiveSource;
}

const USER_SETTINGS_COLLECTION = 'userSettings';
export const ADMIN_SETTINGS_COLLECTION = 'adminSettings';
export const ADMIN_SETTINGS_DOC = 'global';

function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) result[key] = sanitizeForFirestore(value);
  }
  return result;
}

export async function fetchUserSettings(uid?: string | null): Promise<ProviderSettings | null> {
  if (!uid) return null;
  try {
    const ref = doc(db, USER_SETTINGS_COLLECTION, uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as ProviderSettings;
  } catch (err) {
    console.warn('Failed to fetch user provider settings:', err);
    return null;
  }
}

export async function saveUserSettings(uid: string, settings: ProviderSettings): Promise<void> {
  const ref = doc(db, USER_SETTINGS_COLLECTION, uid);
  const clean = sanitizeForFirestore({
    ...settings,
    updatedAt: new Date().toISOString(),
  });
  await setDoc(ref, clean, { merge: true });
}

export async function deleteUserSettings(uid: string): Promise<void> {
  try {
    await deleteDoc(doc(db, USER_SETTINGS_COLLECTION, uid));
  } catch (err) {
    console.warn('Failed to delete user provider settings:', err);
  }
}

export function subscribeUserSettings(uid: string | null | undefined, callback: (s: ProviderSettings | null) => void): () => void {
  if (!uid) {
    callback(null);
    return () => {};
  }
  const ref = doc(db, USER_SETTINGS_COLLECTION, uid);
  return onSnapshot(
    ref,
    (snap) => callback(snap.exists() ? (snap.data() as ProviderSettings) : null),
    (error) => console.error('User settings subscription error:', error)
  );
}

export async function fetchAdminSettings(): Promise<ProviderSettings | null> {
  try {
    const ref = doc(db, ADMIN_SETTINGS_COLLECTION, ADMIN_SETTINGS_DOC);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as ProviderSettings;
  } catch (err) {
    console.warn('Failed to fetch admin provider settings:', err);
    return null;
  }
}

export async function saveAdminSettings(settings: ProviderSettings): Promise<void> {
  const ref = doc(db, ADMIN_SETTINGS_COLLECTION, ADMIN_SETTINGS_DOC);
  const clean = sanitizeForFirestore({
    ...settings,
    displayName: 'إعداد الإدارة الافتراضي',
    updatedAt: new Date().toISOString(),
  });
  await setDoc(ref, clean, { merge: true });
}

export function subscribeAdminSettings(callback: (s: ProviderSettings | null) => void): () => void {
  const ref = doc(db, ADMIN_SETTINGS_COLLECTION, ADMIN_SETTINGS_DOC);
  return onSnapshot(
    ref,
    (snap) => callback(snap.exists() ? (snap.data() as ProviderSettings) : null),
    (error) => console.error('Admin settings subscription error:', error)
  );
}

export function buildEffective(
  settings: ProviderSettings | null,
  source: EffectiveSource
): EffectiveProviderSettings {
  const provider = settings ? getProvider(settings.providerId) : undefined;
  return {
    providerId: settings?.providerId || BUILTIN_DEFAULT.providerId,
    apiKey: settings?.apiKey && settings.apiKey.trim() ? settings.apiKey : BUILTIN_DEFAULT.apiKey,
    model: settings?.model?.trim() || provider?.defaultModel || BUILTIN_DEFAULT.model,
    source,
  };
}

/**
 * الدقة النهائية للمزوّد المفعّل:
 * 1) إعداد المستخدم الشخصي (إن وجد بمفتاح صالح)
 * 2) إعداد الإدارة العام المشترك
 * 3) المفتاح المدمج الافتراضي (Gemini)
 */
export async function resolveEffectiveProviderSettings(uid?: string | null): Promise<EffectiveProviderSettings> {
  if (uid) {
    const user = await fetchUserSettings(uid);
    if (user && user.providerId && getProvider(user.providerId) && user.apiKey && user.apiKey.trim()) {
      return buildEffective(user, 'user');
    }
  }
  const admin = await fetchAdminSettings();
  if (admin && admin.providerId && getProvider(admin.providerId) && admin.apiKey && admin.apiKey.trim()) {
    return buildEffective(admin, 'admin');
  }
  return buildEffective(null, 'builtin');
}