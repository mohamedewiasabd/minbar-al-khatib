import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppInfo } from '../types';

const APPS_COLLECTION = 'apps';

/** اشتراك لحظي بقائمة تطبيقات "تطبيقاتنا" لكل المستخدمين/الزوار */
export function subscribeToApps(callback: (apps: AppInfo[]) => void): () => void {
  const ref = collection(db, APPS_COLLECTION);
  const q = query(ref, orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as AppInfo[];
      callback(list);
    },
    (error) => console.error('Apps subscription error:', error)
  );
}

export interface AppInput {
  name: string;
  details: string;
  packageName: string;
}

/** إضافة تطبيق جديد (يسمح بها المسؤول فقط — القواعد تفرض ذلك أيضاً) */
export async function addApp(input: AppInput): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, APPS_COLLECTION), {
    name: input.name.trim(),
    details: input.details.trim(),
    packageName: input.packageName.trim(),
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

/** تعديل تطبيق موجود (مسؤول فقط) */
export async function updateApp(id: string, input: AppInput): Promise<void> {
  await updateDoc(doc(db, APPS_COLLECTION, id), {
    name: input.name.trim(),
    details: input.details.trim(),
    packageName: input.packageName.trim(),
    updatedAt: new Date().toISOString(),
  });
}

/** حذف تطبيق (مسؤول فقط) */
export async function removeApp(id: string): Promise<void> {
  await deleteDoc(doc(db, APPS_COLLECTION, id));
}