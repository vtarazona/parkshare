import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Scheduled function: Clean up expired spots every 15 minutes.
 * Marks spots as 'expired' if their expiresAt timestamp has passed
 * and they haven't been reserved.
 */
export const cleanupExpiredSpots = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async () => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    try {
      // Query available spots that have expired
      const snapshot = await db
        .collection('spots')
        .where('status', '==', 'available')
        .where('expiresAt', '<=', now)
        .get();

      if (snapshot.empty) {
        console.log('No expired spots to clean up');
        return;
      }

      // Batch update all expired spots
      const batch = db.batch();
      let count = 0;

      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { status: 'expired' });
        count++;
      });

      await batch.commit();
      console.log(`Cleaned up ${count} expired spots`);

      // Also cancel reservations that expired during awaiting_arrival
      await cancelExpiredAwaitingReservations(db, now);
    } catch (error) {
      console.error('Error cleaning up expired spots:', error);
    }
  });

async function cancelExpiredAwaitingReservations(
  db: admin.firestore.Firestore,
  now: admin.firestore.Timestamp
) {
  const snapshot = await db
    .collection('reservations')
    .where('status', '==', 'awaiting_arrival')
    .where('arrivalDeadline', '<=', now)
    .get();

  if (snapshot.empty) return;

  const batch = db.batch();

  for (const reservationDoc of snapshot.docs) {
    const reservation = reservationDoc.data();

    // Cancel the reservation
    batch.update(reservationDoc.ref, { status: 'cancelled' });

    // Free up the spot
    const spotRef = db.doc(`spots/${reservation.spotId}`);
    batch.update(spotRef, {
      status: 'available',
      reservedBy: null,
      reservationId: null,
    });
  }

  await batch.commit();
  console.log(`Cancelled ${snapshot.size} expired awaiting_arrival reservations`);
}
