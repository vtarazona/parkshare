import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { SpotRating } from '../types/spot';

/**
 * Add a rating to a spot and update the spot's average rating.
 */
export async function rateSpot(
  spotId: string,
  userId: string,
  reservationId: string,
  stars: number,
  comment: string | null
): Promise<void> {
  // Add rating to subcollection
  await addDoc(collection(db, 'spots', spotId, 'ratings'), {
    userId,
    reservationId,
    stars,
    comment,
    createdAt: serverTimestamp(),
  });

  // Update spot's average rating
  const spotRef = doc(db, 'spots', spotId);
  const spotDoc = await getDoc(spotRef);

  if (spotDoc.exists()) {
    const data = spotDoc.data();
    const oldCount = data.ratingCount || 0;
    const oldAvg = data.averageRating || 0;
    const newCount = oldCount + 1;
    const newAvg = (oldAvg * oldCount + stars) / newCount;

    await updateDoc(spotRef, {
      averageRating: Math.round(newAvg * 10) / 10,
      ratingCount: newCount,
    });
  }
}

/**
 * Get ratings for a spot.
 */
export async function getSpotRatings(
  spotId: string,
  maxResults: number = 10
): Promise<SpotRating[]> {
  const q = query(
    collection(db, 'spots', spotId, 'ratings'),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as SpotRating)
  );
}
