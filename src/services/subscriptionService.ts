import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase';
import { SubscriptionTier } from '../types/user';

const USERS_COLLECTION = 'users';
const MONTHLY_LIMIT_BASIC = 10;

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt: Timestamp | null;
  monthlyReservationCount: number;
  reservationsRemaining: number | null; // null = unlimited
}

/**
 * Get the current subscription status for a user.
 */
export async function getSubscriptionStatus(
  userId: string
): Promise<SubscriptionStatus> {
  const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
  if (!userDoc.exists()) {
    return {
      tier: 'free',
      isActive: false,
      expiresAt: null,
      monthlyReservationCount: 0,
      reservationsRemaining: 0,
    };
  }

  const data = userDoc.data();
  const tier: SubscriptionTier = data.subscriptionTier || 'free';
  const expiresAt: Timestamp | null = data.subscriptionExpiresAt || null;
  const monthlyCount: number = data.monthlyReservationCount || 0;

  // Check if subscription is still active
  const isActive =
    tier !== 'free' &&
    (expiresAt === null || expiresAt.toMillis() > Date.now());

  let reservationsRemaining: number | null = null;
  if (tier === 'free') {
    reservationsRemaining = 0;
  } else if (tier === 'basic') {
    reservationsRemaining = Math.max(MONTHLY_LIMIT_BASIC - monthlyCount, 0);
  } else {
    // premium = unlimited
    reservationsRemaining = null;
  }

  return {
    tier: isActive ? tier : 'free',
    isActive,
    expiresAt,
    monthlyReservationCount: monthlyCount,
    reservationsRemaining,
  };
}

/**
 * Check if a user can make a reservation (tier + monthly limit).
 * Throws an error if they cannot.
 */
export async function checkReservationLimit(userId: string): Promise<void> {
  const status = await getSubscriptionStatus(userId);

  if (status.tier === 'free') {
    throw new Error(
      'Necesitas una suscripción Basic o Premium para reservar plazas.'
    );
  }

  if (
    status.tier === 'basic' &&
    status.reservationsRemaining !== null &&
    status.reservationsRemaining <= 0
  ) {
    throw new Error(
      `Has alcanzado el límite de ${MONTHLY_LIMIT_BASIC} reservas mensuales del plan Basic. Actualiza a Premium para reservas ilimitadas.`
    );
  }
}

/**
 * Increment the monthly reservation count for a user.
 * Called after a reservation is created successfully.
 */
export async function incrementReservationCount(userId: string): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) return;

  const data = userDoc.data();
  const now = Timestamp.now();
  const lastReset: Timestamp | null = data.lastReservationResetAt || null;

  // Reset counter if it's a new month
  const shouldReset =
    !lastReset ||
    new Date(lastReset.toMillis()).getMonth() !== new Date().getMonth() ||
    new Date(lastReset.toMillis()).getFullYear() !== new Date().getFullYear();

  await updateDoc(userRef, {
    monthlyReservationCount: shouldReset
      ? 1
      : (data.monthlyReservationCount || 0) + 1,
    lastReservationResetAt: shouldReset ? now : lastReset,
  });
}

/**
 * Create a subscription via Cloud Function.
 * Returns the Stripe checkout session URL.
 */
export async function subscribeToPlan(
  plan: 'basic' | 'premium'
): Promise<{ url: string }> {
  const createSubscriptionFn = httpsCallable<
    { plan: string },
    { url: string }
  >(functions, 'createSubscription');

  const result = await createSubscriptionFn({ plan });
  return result.data;
}

/**
 * Cancel the current subscription via Cloud Function.
 */
export async function cancelSubscription(): Promise<void> {
  const cancelFn = httpsCallable(functions, 'cancelSubscription');
  await cancelFn({});
}
