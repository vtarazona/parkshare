import { Timestamp } from 'firebase/firestore';

export type ReservationStatus =
  | 'awaiting_arrival'
  | 'active'
  | 'completed'
  | 'cancelled';

export interface Reservation {
  id: string;
  spotId: string;
  spotOwnerId: string;
  reservedByUserId: string;
  status: ReservationStatus;
  arrivalDeadline: Timestamp;
  arrivedAt: Timestamp | null;
  startedAt: Timestamp | null;
  endedAt: Timestamp | null;
  durationMinutes: number | null;
  totalChargeCents: number | null;
  platformFeeCents: number | null;
  ownerPayoutCents: number | null;
  stripePaymentIntentId: string | null;
  stripeTransferId: string | null;
  createdAt: Timestamp;
}
