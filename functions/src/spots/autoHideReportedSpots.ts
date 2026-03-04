import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

const REPORTS_TO_HIDE = 3;

/**
 * Se dispara cada vez que se crea un reporte.
 * Si la plaza acumula ≥3 reportes, la oculta automáticamente (status: 'flagged').
 */
export const autoHideReportedSpots = onDocumentCreated(
  'reports/{reportId}',
  async (event) => {
    const db = admin.firestore();
    const report = event.data?.data();
    if (!report?.spotId) return;

    const { spotId } = report;

    // Contar reportes no resueltos para esta plaza
    const reportsSnap = await db
      .collection('reports')
      .where('spotId', '==', spotId)
      .where('resolved', '==', false)
      .get();

    if (reportsSnap.size < REPORTS_TO_HIDE) return;

    // Ocultar la plaza
    const spotRef = db.collection('spots').doc(spotId);
    const spotSnap = await spotRef.get();
    if (!spotSnap.exists) return;

    const spot = spotSnap.data()!;

    // No ocultar si ya está flagged, reservada o expirada
    if (spot.status !== 'available') return;

    await spotRef.update({ status: 'flagged' });

    // Notificar al owner
    if (spot.ownerId) {
      const userSnap = await db.collection('users').doc(spot.ownerId).get();
      const pushToken = userSnap.data()?.expoPushToken;

      if (pushToken) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: pushToken,
            title: 'Tu plaza ha sido revisada',
            body: 'Tu plaza ha recibido varios reportes y ha sido ocultada temporalmente. Contacta con soporte si crees que es un error.',
            data: { type: 'spot_flagged', spotId },
          }),
        });
      }
    }
  }
);
