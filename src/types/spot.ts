import { GeoPoint, Timestamp } from 'firebase/firestore';

export type SpotStatus = 'available' | 'reserved' | 'expired';

export interface Spot {
  id: string;
  ownerId: string;
  ownerDisplayName: string;
  status: SpotStatus;
  location: GeoPoint;
  geohash: string;
  address: string;
  description: string;
  pricePerHourCents: number;
  photoURL: string | null;
  reservedBy: string | null;
  reservationId: string | null;
  averageRating: number;
  ratingCount: number;
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

export interface SpotRating {
  id: string;
  userId: string;
  reservationId: string;
  stars: number;
  comment: string | null;
  createdAt: Timestamp;
}
