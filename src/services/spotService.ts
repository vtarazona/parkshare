import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  GeoPoint,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Spot } from '../types/spot';
import { encodeGeohash, getGeohashRanges, distanceBetween } from '../utils/geohash';

const SPOTS_COLLECTION = 'spots';

export interface CreateSpotData {
  ownerId: string;
  ownerDisplayName: string;
  latitude: number;
  longitude: number;
  address: string;
  description: string;
  pricePerHourCents: number;
  photoURL: string | null;
}

export async function createSpot(data: CreateSpotData): Promise<string> {
  const geohash = encodeGeohash(data.latitude, data.longitude);

  // Spot expires in 8 hours
  const expiresAt = Timestamp.fromDate(
    new Date(Date.now() + 8 * 60 * 60 * 1000)
  );

  const spotData = {
    ownerId: data.ownerId,
    ownerDisplayName: data.ownerDisplayName,
    status: 'available' as const,
    location: new GeoPoint(data.latitude, data.longitude),
    geohash,
    address: data.address,
    description: data.description,
    pricePerHourCents: data.pricePerHourCents,
    photoURL: data.photoURL,
    reservedBy: null,
    reservationId: null,
    averageRating: 0,
    ratingCount: 0,
    createdAt: serverTimestamp(),
    expiresAt,
  };

  const docRef = await addDoc(collection(db, SPOTS_COLLECTION), spotData);
  return docRef.id;
}

export async function getSpot(spotId: string): Promise<Spot | null> {
  const spotDoc = await getDoc(doc(db, SPOTS_COLLECTION, spotId));
  if (!spotDoc.exists()) return null;
  return { id: spotDoc.id, ...spotDoc.data() } as Spot;
}

export function subscribeToSpot(
  spotId: string,
  callback: (spot: Spot | null) => void
) {
  return onSnapshot(doc(db, SPOTS_COLLECTION, spotId), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback({ id: snapshot.id, ...snapshot.data() } as Spot);
  });
}

export async function updateSpotStatus(
  spotId: string,
  status: 'available' | 'reserved' | 'expired',
  reservedBy: string | null = null,
  reservationId: string | null = null
) {
  await updateDoc(doc(db, SPOTS_COLLECTION, spotId), {
    status,
    reservedBy,
    reservationId,
  });
}

export async function deleteSpot(spotId: string) {
  await deleteDoc(doc(db, SPOTS_COLLECTION, spotId));
}

/**
 * Subscribe to nearby available spots using geohash range queries.
 * Returns an unsubscribe function.
 */
export function subscribeToNearbySpots(
  latitude: number,
  longitude: number,
  radiusKm: number,
  callback: (spots: Spot[]) => void
) {
  const ranges = getGeohashRanges(latitude, longitude, radiusKm);
  const spotsMap = new Map<string, Spot>();
  const unsubscribes: Array<() => void> = [];

  for (const [lower, upper] of ranges) {
    const q = query(
      collection(db, SPOTS_COLLECTION),
      where('status', '==', 'available'),
      where('geohash', '>=', lower),
      where('geohash', '<=', upper)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      // Update spots from this range
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'removed') {
          spotsMap.delete(change.doc.id);
        } else {
          const spot = { id: change.doc.id, ...change.doc.data() } as Spot;
          // Filter by actual distance (geohash is approximate)
          const dist = distanceBetween(
            latitude,
            longitude,
            spot.location.latitude,
            spot.location.longitude
          );
          if (dist <= radiusKm) {
            spotsMap.set(spot.id, spot);
          } else {
            spotsMap.delete(spot.id);
          }
        }
      });

      callback(Array.from(spotsMap.values()));
    });

    unsubscribes.push(unsub);
  }

  return () => {
    unsubscribes.forEach((unsub) => unsub());
  };
}
