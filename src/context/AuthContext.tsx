import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  reauthenticateWithPopup,
  reauthenticateWithCredential,
  signOut,
  deleteUser,
  GoogleAuthProvider,
  EmailAuthProvider,
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { auth, googleProvider } from '../lib/firebase';
import { deleteUserData } from '../services/pointsService';

const isNative = Capacitor.isNativePlatform();

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isMasterAdmin: boolean;
  loading: boolean;
  error: string | null;
  loginModalOpen: boolean;
  loginReason: string;
  loginWithGoogle: () => Promise<User | null>;
  emailSignIn: (email: string, password: string) => Promise<User | null>;
  emailSignUp: (email: string, password: string, displayName?: string) => Promise<User | null>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (reauthPassword?: string) => Promise<void>;
  openLoginModal: (reason?: string) => void;
  closeLoginModal: () => void;
  clearError: () => void;
}

const MASTER_ADMIN_EMAIL = 'cafnews6@gmail.com';

function friendlyAuthError(error: any, mode: 'login' | 'register' | 'reset'): string {
  const code: string = (error?.code as string) || '';
  if (mode === 'register') {
    if (code.includes('email-already-in-use')) return 'هذا البريد الإلكتروني مسجّل بالفعل. جرّب تسجيل الدخول.';
    if (code.includes('weak-password')) return 'كلمة المرور ضعيفة — يجب ألا تقل عن 6 أحرف.';
    if (code.includes('invalid-email')) return 'صيغة البريد الإلكتروني غير صحيحة.';
    if (code.includes('operation-not-allowed')) return 'تسجيل الدخول بالبريد الإلكتروني غير مفعّل بعد في هذا التطبيق.';
  } else if (mode === 'login') {
    if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found'))
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
    if (code.includes('invalid-email')) return 'صيغة البريد الإلكتروني غير صحيحة.';
    if (code.includes('user-disabled')) return 'تم تعطيل هذا الحساب. تواصل مع الدعم.';
    if (code.includes('too-many-requests')) return 'محاولات كثيرة جداً. انتظر قليلاً ثم أعد المحاولة.';
    if (code.includes('operation-not-allowed')) return 'تسجيل الدخول بالبريد الإلكتروني غير مفعّل بعد في هذا التطبيق.';
  } else {
    if (code.includes('invalid-email')) return 'صيغة البريد الإلكتروني غير صحيحة.';
    if (code.includes('missing-email')) return 'أدخل بريدك الإلكتروني أولاً.';
    if (code.includes('user-not-found')) return 'لا يوجد حساب بهذا البريد. تأكد من بريدك.';
  }
  if (code.includes('network')) return 'انقطع الاتصال بالشبكة. تأكد من اتصالك بالإنترنت.';
  return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [loginReason, setLoginReason] = useState<string>(
    'لتوليد وتعديل وحذف الخطب والسلاسل، يلزم تسجيل الدخول كمسؤول المنبر (Admin).'
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (err) => {
        console.error('Auth state change error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<User | null> => {
    setError(null);
    try {
      if (isNative) {
        const result = await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true });
        if (!result.credential?.idToken) {
          throw new Error('auth/no-credential');
        }
        const credential = GoogleAuthProvider.credential(result.credential.idToken);
        const userCredential = await signInWithCredential(auth, credential);
        setUser(userCredential.user);
        setLoginModalOpen(false);
        return userCredential.user;
      }
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      setLoginModalOpen(false);
      return result.user;
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      const code = err?.code || (typeof err?.message === 'string' ? err.message : '');
      let friendlyMessage = 'فشل تسجيل الدخول بواسطة Google. يرجى المحاولة مرة أخرى.';
      if (code.includes('popup-blocked')) {
        friendlyMessage = 'تم حظر النافذة المنبثقة بواسطة المتصفح. يرجى السماح بالنوافذ المنبثقة والمحاولة مجدداً.';
      } else if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request') || code.includes('cancelled')) {
        friendlyMessage = 'تم إلغاء تسجيل الدخول.';
      } else if (code.includes('operation-not-supported-in-this-environment')) {
        friendlyMessage = 'لا يدعم هذا الجهاز تسجيل الدخول المنبثق. يرجى استخدام التطبيق الأصلي.';
      } else if (code.includes('no-credential')) {
        friendlyMessage = 'لم يتم استلام رمز الدخول من Google. تأكد من تثبيت خدمات Google Play ووجود حساب جوجل على الجهاز.';
      } else if (code.includes('invalid-credential') || code.includes('invalid-id-token')) {
        friendlyMessage = 'رموز الدخول غير صالحة. تأكد من تسجيل بصمة الشهادة الصحيحة في إعدادات Firebase.';
      } else if (code.includes('network')) {
        friendlyMessage = 'انقطع الاتصال بالشبكة أثناء تسجيل الدخول. تأكد من اتصالك بالإنترنت.';
      }
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err: any) {
      console.error('Sign-out error:', err);
      setError('حدث خطأ أثناء تسجيل الخروج');
    }
  };

  /**
   * تسجيل الدخول بالبريد الإلكتروني وكلمة المرور (يعمل على الويب وداخل كاباسيتور عبر Firebase SDK).
   */
  const emailSignIn = async (email: string, password: string): Promise<User | null> => {
    setError(null);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      setUser(credential.user);
      setLoginModalOpen(false);
      return credential.user;
    } catch (err: any) {
      console.error('Email sign-in error:', err);
      const message = friendlyAuthError(err, 'login');
      setError(message);
      throw new Error(message);
    }
  };

  /**
   * إنشاء حساب جديد بالبريد الإلكتروني وكلمة المرور.
   */
  const emailSignUp = async (email: string, password: string, displayName?: string): Promise<User | null> => {
    setError(null);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName?.trim()) {
        await updateProfile(credential.user, { displayName: displayName.trim() });
      }
      setUser(auth.currentUser);
      setLoginModalOpen(false);
      return auth.currentUser;
    } catch (err: any) {
      console.error('Email sign-up error:', err);
      const message = friendlyAuthError(err, 'register');
      setError(message);
      throw new Error(message);
    }
  };

  /**
   * إرسال رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني.
   */
  const sendPasswordReset = async (email: string): Promise<void> => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      console.error('Password reset error:', err);
      const message = friendlyAuthError(err, 'reset');
      setError(message);
      throw new Error(message);
    }
  };

  /**
   * حذف الحساب نهائياً (متطلب سياسة Google Play)
   * — حذف بيانات المستخدم من Firestore أولاً، ثم تجديد التوثيق، ثم حذف حساب المصادقة.
   */
  const deleteAccount = async (reauthPassword?: string): Promise<void> => {
    setError(null);
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      // 1) حذف البيانات (سجل النقاط + المستند الشخصي) قبل حذف الحساب
      await deleteUserData(currentUser.uid);

      // 2) تجديد التوثيق لتفادي قيد (requires recent login) قبل الحذف
      const providerIds = (currentUser.providerData || []).map((p) => p.providerId);
      if (providerIds.includes('google.com')) {
        // مستخدم Google
        if (isNative) {
          const result = await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true });
          if (!result.credential?.idToken) {
            throw new Error('auth/no-credential');
          }
          const credential = GoogleAuthProvider.credential(result.credential.idToken);
          await signInWithCredential(auth, credential);
        } else {
          await reauthenticateWithPopup(currentUser, googleProvider);
        }
      } else if (currentUser.email) {
        // مستخدم البريد الإلكتروني وكلمة المرور
        if (!reauthPassword) {
          setError('يرجى إدخال كلمة المرور لتأكيد حذف الحساب.');
          throw new Error('reauth-password-required');
        }
        await reauthenticateWithCredential(
          auth.currentUser as User,
          EmailAuthProvider.credential(currentUser.email, reauthPassword)
        );
      } else {
        throw new Error('auth/no-provider');
      }

      // 3) حذف حساب المصادقة نهائياً
      const toDelete = auth.currentUser;
      if (toDelete) await deleteUser(toDelete);

      setUser(null);
      setLoginModalOpen(false);
    } catch (err: any) {
      console.error('Account deletion error:', err);
      const code: string = (err?.code as string) || '';
      if (err?.message === 'reauth-password-required') {
        throw err;
      }
      if (code.includes('wrong-password')) {
        setError('كلمة المرور غير صحيحة. حاول مرة أخرى.');
        throw new Error('reauth-password-required');
      }
      if (code.includes('requires-recent-login')) {
        setError('يجب تسجيل الدخول مجدداً قبل حذف الحساب. سجّل الخروج ثم ادخل من جديد.');
        throw new Error('delete-account-failed');
      }
      setError('حدث خطأ أثناء حذف الحساب. يرجى المحاولة مرة أخرى.');
      throw new Error('delete-account-failed');
    }
  };

  const openLoginModal = (reason?: string) => {
    if (reason) {
      setLoginReason(reason);
    }
    setLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setLoginModalOpen(false);
    setError(null);
  };

  const clearError = () => setError(null);

  // Master admin is the only account with generation, edit, and deletion rights
  const isMasterAdmin = Boolean(
    user?.email && user.email.trim().toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()
  );
  const isAdmin = isMasterAdmin;


  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isMasterAdmin,
        loading,
        error,
        loginModalOpen,
        loginReason,
        loginWithGoogle,
        emailSignIn,
        emailSignUp,
        sendPasswordReset,
        logout,
        deleteAccount,
        openLoginModal,
        closeLoginModal,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
