// =====================================================================
// مكتبة المستخدم المحلية: المفضلة + الحفظ للقراءة دون اتصال
// تعمل لكل الزوار (بلا تسجيل دخول) وتُحفظ في التخزين المحلي للجهاز.
// =====================================================================
import { Sermon } from '../types';

const FAVORITES_KEY = 'minbar:favorites:v1';
const OFFLINE_KEY = 'minbar:offline-sermons:v1';
const MAX_OFFLINE_SERMONS = 40;

/** حدث يُطلق بعد أي تغيير كي تتزامن كل المكوّنات المفتوحة */
export const LIBRARY_CHANGE_EVENT = 'minbar:library-changed';

const notify = () => {
  window.dispatchEvent(new Event(LIBRARY_CHANGE_EVENT));
};

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notify();
  } catch {
    // تجاوز حصة التخزين — تجاهل بهدوء حتى لا يتعطل التطبيق
  }
};

export const getFavoriteIds = (): string[] => readJson<string[]>(FAVORITES_KEY, []);

export const isFavorite = (id: string): boolean => getFavoriteIds().includes(id);

export const toggleFavorite = (id: string): boolean => {
  const current = getFavoriteIds();
  const next = current.includes(id) ? current.filter((item) => item !== id) : [id, ...current];
  writeJson(FAVORITES_KEY, next);
  return next.includes(id);
};

export const getOfflineSermons = (): Sermon[] => readJson<Sermon[]>(OFFLINE_KEY, []);

export const isOfflineSaved = (id: string): boolean => getOfflineSermons().some((s) => s.id === id);

/** حفظ نسخة كاملة من الخطبة على الجهاز لقراءتها لاحقاً بدون إنترنت */
export const saveOfflineSermon = (sermon: Sermon): boolean => {
  const current = getOfflineSermons().filter((s) => s.id !== sermon.id);
  const next = [sermon, ...current].slice(0, MAX_OFFLINE_SERMONS);
  writeJson(OFFLINE_KEY, next);
  return true;
};

export const removeOfflineSermon = (id: string): void => {
  writeJson(
    OFFLINE_KEY,
    getOfflineSermons().filter((s) => s.id !== id)
  );
};
