import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  initializeAuth,
  getAuth,
  indexedDBLocalPersistence,
  GoogleAuthProvider
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase client instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId if configured
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Authentication with Google Provider
// داخل كاباسيتور نستخدم indexedDBLocalPersistence كي تبقى الجلسة محفوظة عبر عمليات إعادة التشغيل
export const auth = Capacitor.isNativePlatform()
  ? initializeAuth(app, {
      persistence: indexedDBLocalPersistence,
    })
  : getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export { app };
