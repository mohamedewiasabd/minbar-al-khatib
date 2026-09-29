// =====================================================================
// إعدادات مزوّدات الذكاء الاصطناعي في Firestore
// - userSettings/{uid}: إعداد المستخدم الشخصي (المالك وحده) + اختيار مزوّد مشترك
// - sharedProviders/{docId}: مزوّدات مفتوحة للاستخدام العام (يقرؤها المصادقون)
// - providerRewards/{autoId}: مكافأة نقطة لصاحب المزوّد المشترك عند كل استخدام
// - adminSettings/global: المفتاح العام/الافتراضي الذي تحدده الإدارة
// الدقة: مزوّد المستخدم ← مزوّد مشترك مختار ← إعداد الإدارة ← المفتاح المدمج.
// =====================================================================
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { ProviderCallSettings, BUILTIN_DEFAULT, getProvider } from './providers';
import { addPoints } from '../services/pointsService';

export interface ProviderSettings extends ProviderCallSettings {
  displayName?: string;
  updatedAt?: string;
  /** معرف مزوّد مشترك مختار (عند عدم وضع مفتاح شخصي) */
  sharedProviderId?: string;
}

export type EffectiveSource = 'user' | 'shared' | 'admin' | 'builtin';

export interface EffectiveProviderSettings extends ProviderSettings {
  source: EffectiveSource;
  sharedOwnerUid?: string;
  sharedProviderDocId?: string;
}

export interface SharedProviderDoc {
  id: string;
  ownerUid: string;
  ownerName: string;
  providerId: string;
  apiKey: string;
  model?: string;
  active: boolean;
  usageCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProviderReward {
  id: string;
  ownerUid: string;
  fromUid: string;
  amount: number;
  reason?: string;
  providerDocId: string;
  createdAt: string;
  claimed: boolean;
}

export interface GenerationAccess {
  free: boolean;
  source: EffectiveSource;
  sharedOwnerUid?: string;
  sharedProviderDocId?: string;
}

const USER_SETTINGS_COLLECTION = 'userSettings';
export const ADMIN_SETTINGS_COLLECTION = 'adminSettings';
export const ADMIN_SETTINGS_DOC = 'global';
export const SHARED_PROVIDERS_COLLECTION = 'sharedProviders';
export const PROVIDER_REWARDS_COLLECTION = 'providerRewards';

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

function providerHasUsableKey(settings: { providerId: string; apiKey?: string }): boolean {
  const provider = getProvider(settings.providerId);
  if (!provider) return false;
  if (provider.requiresKey) return Boolean(settings.apiKey && settings.apiKey.trim());
  return true;
}

// ---------------------------------------------------------------- إعدادات المستخدم
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
    providerId: settings.providerId || '',
    apiKey: settings.apiKey || '',
    model: settings.model || '',
    sharedProviderId: '',
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

/** اختيار مزوّد مشترك للاستخدام (يمسح الإعداد الشخصي) أو إلغاؤه (بإرسال '') */
export async function setSharedProviderSelection(uid: string, sharedProviderId: string): Promise<void> {
  const ref = doc(db, USER_SETTINGS_COLLECTION, uid);
  const now = new Date().toISOString();
  const clean = sanitizeForFirestore({
    providerId: '',
    apiKey: '',
    model: '',
    sharedProviderId,
    updatedAt: now,
  });
  await setDoc(ref, clean, { merge: true });
}

// ---------------------------------------------------------------- المزوّدات المشتركة
export async function createSharedProvider(
  uid: string,
  ownerName: string,
  settings: ProviderSettings
): Promise<string> {
  const provider = getProvider(settings.providerId);
  if (!provider) throw new Error('مزوّد غير معروف.');
  if (provider.requiresKey && !(settings.apiKey || '').trim()) {
    throw new Error('لا يمكن مشاركة هذا المزوّد دون مفتاح API.');
  }
  if (!provider.requiresKey) {
    throw new Error('المزوّدات المحلية (Ollama) لا تُشارك للاستخدام العام.');
  }
  const now = new Date().toISOString();
  const ref = doc(collection(db, SHARED_PROVIDERS_COLLECTION));
  await setDoc(
    ref,
    sanitizeForFirestore({
      ownerUid: uid,
      ownerName: ownerName || 'مستخدم منبر',
      providerId: settings.providerId,
      apiKey: settings.apiKey,
      model: settings.model || '',
      active: true,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    })
  );
  return ref.id;
}

export async function removeSharedProvider(docId: string, ownerUid: string): Promise<void> {
  try {
    await deleteDoc(doc(db, SHARED_PROVIDERS_COLLECTION, docId));
  } catch (err) {
    console.warn('Failed to remove shared provider:', err);
  }
}

export async function getSharedProvider(docId: string): Promise<SharedProviderDoc | null> {
  try {
    const ref = doc(db, SHARED_PROVIDERS_COLLECTION, docId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as SharedProviderDoc;
  } catch (err) {
    console.warn('Failed to fetch shared provider:', err);
    return null;
  }
}

export async function listSharedProviders(): Promise<SharedProviderDoc[]> {
  try {
    const q = query(collection(db, SHARED_PROVIDERS_COLLECTION), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as SharedProviderDoc)
      .filter((p) => p.active === true);
  } catch (err) {
    console.warn('Failed to list shared providers:', err);
    return [];
  }
}

export function subscribeSharedProviders(callback: (list: SharedProviderDoc[]) => void): () => void {
  const q = query(collection(db, SHARED_PROVIDERS_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as SharedProviderDoc)
        .filter((p) => p.active === true);
      callback(list);
    },
    (error) => console.error('Shared providers subscription error:', error)
  );
}

// ---------------------------------------------------------------- مكافآت المشاركة
/** تسجيل استحقاق نقطة لصاحب المزوّد المشترك بعد نجاح التوليد به */
export async function recordProviderReward(providerDocId: string, fromUid: string): Promise<void> {
  try {
    const provider = await getSharedProvider(providerDocId);
    if (!provider || !provider.active || provider.ownerUid === fromUid) return;
    const ref = doc(collection(db, PROVIDER_REWARDS_COLLECTION));
    await setDoc(
      ref,
      sanitizeForFirestore({
        ownerUid: provider.ownerUid,
        fromUid,
        amount: 1,
        reason: 'فتح مزوّدي للاستخدام العام وتوليد خطبة به',
        providerDocId,
        createdAt: new Date().toISOString(),
        claimed: false,
      })
    );
  } catch (err) {
    console.warn('Failed to record provider reward:', err);
  }
}

/** استحقاق المكافآت غير المطالب بها للمالك (يُستدعى بعد تسجيل دخول المالك) */
export async function claimPendingProviderRewards(uid: string): Promise<void> {
  try {
    const q = query(collection(db, PROVIDER_REWARDS_COLLECTION), where('ownerUid', '==', uid));
    const snap = await getDocs(q);
    const pending = snap.docs.filter((d) => (d.data()?.claimed as boolean) !== true);
    for (const d of pending) {
      const data = d.data() as ProviderReward;
      const amount = Number(data.amount) > 0 ? Number(data.amount) : 1;
      const ok = await addPoints(
        uid,
        amount,
        data.reason || 'أرباح مشاركة مزوّدي العام'
      );
      if (ok) {
        await updateDoc(d.ref, { claimed: true });
      }
    }
  } catch (err) {
    console.warn('Failed to claim pending provider rewards:', err);
  }
}

export function subscribeProviderRewardsForOwner(uid: string | null | undefined, callback: (list: ProviderReward[]) => void): () => void {
  if (!uid) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, PROVIDER_REWARDS_COLLECTION), where('ownerUid', '==', uid));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ProviderReward)),
    (error) => console.error('Provider rewards subscription error:', error)
  );
}

// ---------------------------------------------------------------- إعدادات الإدارة
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
 * الدقة النهائية للمزوّد المفعّل للتوليد:
 * 1) مزوّد المستخدم الشخصي (مفتاح صالح)
 * 2) مزوّد مشترك مختار من مستخدم آخَر
 * 3) إعداد الإدارة العام المشترك
 * 4) المفتاح المدمج الافتراضي (Gemini)
 */
export async function resolveEffectiveProviderSettings(uid?: string | null): Promise<EffectiveProviderSettings> {
  if (uid) {
    const user = await fetchUserSettings(uid);
    if (user) {
      // 1) مزوّد شخصي فعّال
      if (user.providerId && providerHasUsableKey(user)) {
        return buildEffective(user, 'user');
      }
      // 2) مزوّد مشترك مختار
      if (user.sharedProviderId) {
        const shared = await getSharedProvider(user.sharedProviderId);
        if (shared && shared.active) {
          const sharedProvider = getProvider(shared.providerId);
          if (sharedProvider && (!sharedProvider.requiresKey || (shared.apiKey && shared.apiKey.trim()))) {
            return {
              providerId: shared.providerId,
              apiKey: shared.apiKey,
              model: shared.model || sharedProvider.defaultModel,
              source: 'shared',
              sharedOwnerUid: shared.ownerUid,
              sharedProviderDocId: shared.id,
            };
          }
        }
      }
    }
  }
  // 3) إعداد الإدارة
  const admin = await fetchAdminSettings();
  if (admin && admin.providerId && getProvider(admin.providerId) && admin.apiKey && admin.apiKey.trim()) {
    return buildEffective(admin, 'admin');
  }
  // 4) المدمج
  return buildEffective(null, 'builtin');
}

/**
 * وصول المستخدم للتوليد:
 * free=true لمن يملك مزوّداً خاصاً فعّالاً أو استخدم مزوّداً مشتركاً (بدون نقاط ولا إعلان).
 * عند المصدر 'shared' تُعاد بيانات صاحب المزوّد لتسجيل مكافأته بعد نجاح التوليد.
 */
export async function resolveGenerationAccess(uid?: string | null): Promise<GenerationAccess> {
  const eff = await resolveEffectiveProviderSettings(uid);
  return {
    free: eff.source === 'user' || eff.source === 'shared',
    source: eff.source,
    sharedOwnerUid: eff.sharedOwnerUid,
    sharedProviderDocId: eff.sharedProviderDocId,
  };
}