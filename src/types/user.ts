import { Timestamp } from 'firebase/firestore';

export type SubscriptionTier = 'free' | 'basic' | 'premium';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  stripeConnectAccountId: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  expoPushToken: string | null;
  createdAt: Timestamp;
  totalEarnings: number;
  averageRating: number;
  ratingCount: number;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt: Timestamp | null;
  monthlyReservationCount: number;
  lastReservationResetAt: Timestamp | null;
}
