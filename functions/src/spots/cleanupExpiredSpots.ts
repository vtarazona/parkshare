import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

export const cleanupExpiredSpots = onSchedule('every 15 minutes', async () => {
  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();

  try {
    // Marcar plazas expiradas
    const spotsSnapshot = await db
      .collection('spots')
      .where('status', '==', 'available')
      .where('expiresAt', '<=', now)
      .get();

    if (!spotsSnapshot.empty) {
      const batch = db.batch();
      spotsSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { status: 'expired' });
      });
      await batch.commit();
      console.log(`Cleaned up ${spotsSnapshot.size} expired spots`);
    }

    // Cancelar reservas awaiting_arrival cuyo countdown expiró
    const reservationsSnapshot = await db
      .collection('reservations')
      .where('status', '==', 'awaiting_arrival')
      .where('arrivalDeadline', '<=', now)
      .get();

    if (!reservationsSnapshot.empty) {
      const batch = db.batch();
      for (const reservationDoc of reservationsSnapshot.docs) {
        const reservation = reservationDoc.data();
        batch.update(reservationDoc.ref, { status: 'cancelled' });
        batch.update(db.doc(`spots/${reservation.spotId}`), {
          status: 'available',
          reservedBy: null,
          reservationId: null,
        });
      }
      await batch.commit();
      console.log(`Cancelled ${reservationsSnapshot.size} expired reservations`);
    }
  } catch (error) {
    console.error('Error in cleanupExpiredSpots:', error);
  }
});
