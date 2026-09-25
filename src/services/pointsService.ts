import {
  collection,
  doc,
  getDoc,
  setDoc,
  runTransaction,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, PointTransaction } from '../types';

const USERS_COLLECTION = 'users';
const TRANSACTIONS_SUBCOLLECTION = 'transactions';

/** نقطة واحدة تُمنح مقابل كل مشاهدة إعلان بمكافأة */
export const POINTS_PER_REWARDED_AD = 1;
/** تكلفة توليد خطبة مفردة */
export const SINGLE_SERMON_COST = 1;
/** تكلفة توليد سلسلة خطب (ثابتة = 5 خطب حتى لو وُلّدت بأجزاء أقل) */
export const SERIES_SERMON_COST = 5;

/** حساب التكلفة حسب طلب التوليد */
export function generationCost(isSeries: boolean): number {
  return isSeries ? SERIES_SERMON_COST : SINGLE_SERMON_COST;
}

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

/**
 * تأكيد وجود مستند المستخدم في Firestore (إنشاء برصيد صفري عند اللزوم)
 */
export async function ensureUserProfile(user: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}): Promise<void> {
  const ref = doc(db, USERS_COLLECTION, user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  const now = new Date().toISOString();
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    points: 0,
    totalEarned: 0,
    totalSpent: 0,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(ref, sanitizeForFirestore(profile));
}

/**
 * قراءة رصيد النقاط مباشرة (تُستخدم داخلياً عند الحاجة للتأكد)
 */
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, USERS_COLLECTION, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

/**
 * اشتراك لحظي برصيد المستخدم
 */
export function subscribeToUserProfile(uid: string, callback: (profile: UserProfile | null) => void): () => void {
  const ref = doc(db, USERS_COLLECTION, uid);
  return onSnapshot(
    ref,
    (snap) => callback(snap.exists() ? (snap.data() as UserProfile) : null),
    (error) => console.error('User profile subscription error:', error)
  );
}

/**
 * اشتراك لحظي بسجل العمليات (آخر 20 عملية)
 */
export function subscribeToPointTransactions(uid: string, callback: (list: PointTransaction[]) => void): () => void {
  const ref = collection(db, USERS_COLLECTION, uid, TRANSACTIONS_SUBCOLLECTION);
  const q = query(ref, orderBy('createdAt', 'desc'), limit(20));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as PointTransaction[];
      callback(list);
    },
    (error) => console.error('Transactions subscription error:', error)
  );
}

/**
 * منح نقاط (بعد مشاهدة إعلان بمكافأة أو استرجاع عند فشل التوليد) بحرية transaction لمنع السباق
 */
export async function addPoints(uid: string, amount: number, reason: string): Promise<boolean> {
  try {
    await runTransaction(db, async (tx) => {
      const ref = doc(db, USERS_COLLECTION, uid);
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('profile-not-found');

      const current = snap.data() as UserProfile;
      const now = new Date().toISOString();
      const newProfile: Partial<UserProfile> = {
        points: (current.points || 0) + amount,
        totalEarned: (current.totalEarned || 0) + amount,
        updatedAt: now,
      };
      await tx.update(ref, sanitizeForFirestore(newProfile));

      const txRef = doc(collection(db, USERS_COLLECTION, uid, TRANSACTIONS_SUBCOLLECTION));
      const record: PointTransaction = {
        id: txRef.id,
        type: 'earn',
        amount,
        reason,
        createdAt: now,
      };
      await tx.set(txRef, sanitizeForFirestore(record));
    });
    return true;
  } catch (err) {
    console.error('Failed to add points:', err);
    return false;
  }
}

/**
 * استرجاع نقاط محصومة (عند فشل التوليد لاحقاً)
 */
export async function refundPoints(uid: string, amount: number, reason: string): Promise<boolean> {
  return addPoints(uid, amount, reason);
}
/**
 * خصم نقاط بعد نجاح التوليد (transaction يضمن عدم نزول الرصيد تحت الصفر)
 */
export async function spendPoints(uid: string, amount: number, reason: string): Promise<boolean> {
  try {
    return await runTransaction(db, async (tx) => {
      const ref = doc(db, USERS_COLLECTION, uid);
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('profile-not-found');

      const current = snap.data() as UserProfile;
      const balance = current.points || 0;
      if (balance < amount) return false;

      const now = new Date().toISOString();
      await tx.update(ref, sanitizeForFirestore({
        points: balance - amount,
        totalSpent: (current.totalSpent || 0) + amount,
        updatedAt: now,
      }));

      const txRef = doc(collection(db, USERS_COLLECTION, uid, TRANSACTIONS_SUBCOLLECTION));
      await tx.set(txRef, sanitizeForFirestore({
        id: txRef.id,
        type: 'spend',
        amount,
        reason,
        createdAt: now,
      }));
      return true;
    });
  } catch (err) {
    console.error('Failed to spend points:', err);
    return false;
  }
}

/**
 * حذف بيانات المستخدم نهائياً من Firestore (سجل النقاط + المستند الشخصي)
 * يُستدعى قبل حذف حساب المصادقة عند طلب المستخدم حذف حسابه.
 */
export async function deleteUserData(uid: string): Promise<void> {
  const txsQuery = collection(db, USERS_COLLECTION, uid, TRANSACTIONS_SUBCOLLECTION);
  const txsSnap = await getDocs(txsQuery);
  await Promise.all(txsSnap.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(db, USERS_COLLECTION, uid));
}