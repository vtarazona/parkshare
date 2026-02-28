import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

/**
 * Firestore trigger: Send push notification when a reservation status changes.
 */
export const onReservationChange = functions.firestore
  .document('reservations/{reservationId}')
  .onWrite(async (change, _context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (!after) return; // Document deleted

    const db = admin.firestore();

    // Nueva reserva creada (conductor reservó, esperando llegada)
    if (!before && after.status === 'awaiting_arrival') {
      const ownerDoc = await db.doc(`users/${after.spotOwnerId}`).get();
      const ownerData = ownerDoc.data();

      if (ownerData?.expoPushToken) {
        await sendNotification(
          ownerData.expoPushToken,
          '¡Tu plaza ha sido reservada!',
          'Un conductor viene en camino. Tiene 5 minutos para llegar.'
        );
      }
      return;
    }

    // Conductor confirmó llegada (awaiting_arrival → active)
    if (before?.status === 'awaiting_arrival' && after.status === 'active') {
      const ownerDoc = await db.doc(`users/${after.spotOwnerId}`).get();
      const ownerData = ownerDoc.data();

      if (ownerData?.expoPushToken) {
        await sendNotification(
          ownerData.expoPushToken,
          '¡El conductor ha llegado!',
          'Tu plaza está siendo utilizada. Recibirás el pago al finalizar.'
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

    // Reserva cancelada (manual o por expiración del countdown)
    if (
      (before?.status === 'awaiting_arrival' || before?.status === 'active') &&
      after.status === 'cancelled'
    ) {
      const ownerDoc = await db.doc(`users/${after.spotOwnerId}`).get();
      const ownerData = ownerDoc.data();

      if (ownerData?.expoPushToken) {
        await sendNotification(
          ownerData.expoPushToken,
          'Reserva cancelada',
          'La reserva de tu plaza ha sido cancelada. Tu plaza vuelve a estar disponible.'
        );
      }

      // Si expiró el countdown, notificar también al conductor
      if (before?.status === 'awaiting_arrival') {
        const userDoc = await db.doc(`users/${after.reservedByUserId}`).get();
        const userData = userDoc.data();

        if (userData?.expoPushToken) {
          await sendNotification(
            userData.expoPushToken,
            'Reserva expirada',
            'No llegaste a tiempo y tu reserva ha sido cancelada automáticamente.'
          );
        }
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
