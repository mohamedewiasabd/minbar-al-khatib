import React, { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import { UserProfile, PointTransaction } from '../types';
import { useAuth } from './AuthContext';
import { showRewardedAd } from '../lib/admob';
import {
  ensureUserProfile,
  subscribeToUserProfile,
  subscribeToPointTransactions,
  addPoints,
  spendPoints,
  generationCost,
  POINTS_PER_REWARDED_AD,
} from '../services/pointsService';

interface PointsContextType {
  /** رصيد النقاط الحالي للمستخدم المسجّل */
  points: number;
  /** بيانات البروفايل الكاملة (نقاط، إجمالي مكتسب/منفق) */
  profile: UserProfile | null;
  /** سجل العمليات الأخيرة (مكسب/خصم) */
  transactions: PointTransaction[];
  /** هل الرصيد جاهز للقراءة؟ */
  ready: boolean;
  /** مشاهدة إعلان بمكافأة وكسب نقطة — تعيد هل كسب المستخدم نقطة فعلية؟ */
  watchRewardedForPoints: () => Promise<boolean>;
  /** خصم نقاط بعد نجاح التوليد */
  spendPointsForGeneration: (cost: number, reason: string) => Promise<boolean>;
  /** استرجاع النقاط عند فشل التوليد */
  refundPoints: (amount: number, reason: string) => Promise<boolean>;
  /** حساب تكلفة التوليد (خطبة مفردة أو سلسلة) */
  costFor: (isSeries: boolean) => number;
  /** هل الرصيد يكفي لتوليد؟ */
  canAfford: (isSeries: boolean) => boolean;
}

const PointsContext = createContext<PointsContextType | undefined>(undefined);

export const PointsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [ready, setReady] = useState<boolean>(false);
  const watchingRef = useRef(false);

  useEffect(() => {
    if (!user?.uid) {
      setProfile(null);
      setTransactions([]);
      setReady(false);
      return;
    }

    let unsubscribeProfile: (() => void) | null = null;
    let unsubscribeTransactions: (() => void) | null = null;
    let active = true;

    (async () => {
      try {
        await ensureUserProfile(user);
      } catch (err) {
        console.error('Failed to ensure user profile:', err);
      }
      if (!active) return;

      unsubscribeProfile = subscribeToUserProfile(user.uid, (p) => {
        setProfile(p);
        setReady(true);
      });
      unsubscribeTransactions = subscribeToPointTransactions(user.uid, setTransactions);
    })();

    return () => {
      active = false;
      unsubscribeProfile?.();
      unsubscribeTransactions?.();
    };
  }, [user?.uid]);

  const watchRewardedForPoints = useCallback(async (): Promise<boolean> => {
    if (!user?.uid) return false;
    if (watchingRef.current) return false;

    watchingRef.current = true;
    try {
      const { rewarded } = await showRewardedAd();
      if (rewarded) {
        await addPoints(user.uid, POINTS_PER_REWARDED_AD, 'مشاهدة إعلان بمكافأة');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Rewarded ad reward flow failed:', err);
      return false;
    } finally {
      watchingRef.current = false;
    }
  }, [user?.uid]);

  const spendPointsForGeneration = useCallback(
    async (cost: number, reason: string): Promise<boolean> => {
      if (!user?.uid) return false;
      return spendPoints(user.uid, cost, reason);
    },
    [user?.uid]
  );

  const refundPoints = useCallback(
    async (amount: number, reason: string): Promise<boolean> => {
      if (!user?.uid) return false;
      return addPoints(user.uid, amount, reason);
    },
    [user?.uid]
  );

  const costFor = useCallback((isSeries: boolean) => generationCost(isSeries), []);

  const canAfford = useCallback(
    (isSeries: boolean) => {
      const cost = generationCost(isSeries);
      return (profile?.points || 0) >= cost;
    },
    [profile?.points]
  );

  const points = profile?.points || 0;

  return (
    <PointsContext.Provider
      value={{
        points,
        profile,
        transactions,
        ready,
        watchRewardedForPoints,
        spendPointsForGeneration,
        refundPoints,
        costFor,
        canAfford,
      }}
    >
      {children}
    </PointsContext.Provider>
  );
};

export function usePoints(): PointsContextType {
  const context = useContext(PointsContext);
  if (!context) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return context;
}

