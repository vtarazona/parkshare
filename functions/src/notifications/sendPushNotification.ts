import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

/**
 * Firestore trigger: Send push notification when a reservation status changes.
 */
export const onReservationChange = functions.firestore
  .document('reservations/{reservationId}')
  .onWrite(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (!after) return; // Document deleted

    const db = admin.firestore();

    // New reservation created
    if (!before && after.status === 'active') {
      // Notify spot owner
      const ownerDoc = await db
        .doc(`users/${after.spotOwnerId}`)
        .get();
      const ownerData = ownerDoc.data();

      if (ownerData?.expoPushToken) {
        await sendNotification(
          ownerData.expoPushToken,
          '¡Tu plaza ha sido reservada!',
          'Alguien está usando tu plaza de parking. Recibirás el pago cuando finalice.'
        );
      }
      return;
    }

    // Reservation completed (payment successful)
    if (before?.status === 'active' && after.status === 'completed') {
      // Notify owner about payment
      const ownerDoc = await db
        .doc(`users/${after.spotOwnerId}`)
        .get();
      const ownerData = ownerDoc.data();

      if (ownerData?.expoPushToken && after.ownerPayoutCents) {
        const amount = (after.ownerPayoutCents / 100).toFixed(2);
        await sendNotification(
          ownerData.expoPushToken,
          '¡Pago recibido!',
          `Has ganado ${amount} € por tu plaza de parking.`
        );
      }

      // Notify the user that parking session is complete
      const userDoc = await db
        .doc(`users/${after.reservedByUserId}`)
        .get();
      const userData = userDoc.data();

      if (userData?.expoPushToken) {
        await sendNotification(
          userData.expoPushToken,
          'Sesión finalizada',
          'Tu sesión de parking ha terminado. ¡Gracias por usar ParkShare!'
        );
      }
      return;
    }

    // Reservation cancelled
    if (before?.status === 'active' && after.status === 'cancelled') {
      const ownerDoc = await db
        .doc(`users/${after.spotOwnerId}`)
        .get();
      const ownerData = ownerDoc.data();

      if (ownerData?.expoPushToken) {
        await sendNotification(
          ownerData.expoPushToken,
          'Reserva cancelada',
          'La reserva de tu plaza ha sido cancelada. Tu plaza vuelve a estar disponible.'
        );
      }
    }
  });

async function sendNotification(
  pushToken: string,
  title: string,
  body: string
): Promise<void> {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Invalid Expo push token: ${pushToken}`);
    return;
  }

  const message: ExpoPushMessage = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data: { type: 'reservation_update' },
  };

  try {
    const tickets = await expo.sendPushNotificationsAsync([message]);
    console.log('Push notification sent:', tickets);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}
