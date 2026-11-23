import { useEffect, useState } from 'react';
import { Sermon } from '../types';
import {
  getFavoriteIds,
  getOfflineSermons,
  isFavorite,
  isOfflineSaved,
  LIBRARY_CHANGE_EVENT,
  removeOfflineSermon,
  saveOfflineSermon,
  toggleFavorite,
} from '../lib/sermonLibrary';

/** مكتبة محلية متزامنة بين كل المكوّنات (مفضلة + خطب محفوظة دون اتصال) */
export function useSermonLibrary() {
  const [favorites, setFavorites] = useState<string[]>(() => getFavoriteIds());
  const [offlineSermons, setOfflineSermons] = useState<Sermon[]>(() => getOfflineSermons());

  useEffect(() => {
    const sync = () => {
      setFavorites(getFavoriteIds());
      setOfflineSermons(getOfflineSermons());
    };
    window.addEventListener(LIBRARY_CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(LIBRARY_CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return {
    favorites,
    offlineSermons,
    isFavorite: (id: string) => favorites.includes(id),
    isOfflineSaved: (id: string) => offlineSermons.some((s) => s.id === id),
    toggleFavorite,
    saveOfflineSermon,
    removeOfflineSermon,
    // تُستخدم للتحقق المباشر خارج حالة React
    isFavoriteNow: isFavorite,
    isOfflineSavedNow: isOfflineSaved,
  };
}
