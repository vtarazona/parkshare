import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const PLATFORM_FEE_RATE = 0.20; // 20%

/**
 * Create a Stripe PaymentIntent for a completed reservation.
 * Calculates the charge and sets up the transfer to the spot owner.
 */
export const createPaymentIntent = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Debes iniciar sesión'
      );
    }

    const { reservationId } = data;
    if (!reservationId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Se requiere reservationId'
      );
    }

    try {
      const db = admin.firestore();

      // Get reservation
      const reservationDoc = await db
        .doc(`reservations/${reservationId}`)
        .get();

      if (!reservationDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Reserva no encontrada'
        );
      }

      const reservation = reservationDoc.data()!;

      // Verify the caller is the one who reserved
      if (reservation.reservedByUserId !== context.auth.uid) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'No autorizado'
        );
      }

      // Get the total charge from the reservation (already calculated)
      const totalChargeCents = reservation.totalChargeCents;
      if (!totalChargeCents || totalChargeCents <= 0) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'El importe no es válido'
        );
      }

      // Get spot owner's Stripe Connect account
      const ownerDoc = await db
        .doc(`users/${reservation.spotOwnerId}`)
        .get();

      const ownerData = ownerDoc.data();
      if (!ownerData?.stripeConnectAccountId) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'El propietario no tiene pagos configurados'
        );
      }

      // Get or create Stripe Customer for the payer
      const payerDoc = await db
        .doc(`users/${reservation.reservedByUserId}`)
        .get();

      const payerData = payerDoc.data();
      let customerId = payerData?.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: payerData?.email,
          metadata: { userId: reservation.reservedByUserId },
        });
        customerId = customer.id;

        await db.doc(`users/${reservation.reservedByUserId}`).update({
          stripeCustomerId: customerId,
        });
      }

      // Calculate platform fee
      const platformFeeCents = Math.round(totalChargeCents * PLATFORM_FEE_RATE);

      // Create PaymentIntent with Connect transfer
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalChargeCents,
        currency: 'eur',
        customer: customerId,
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: ownerData.stripeConnectAccountId,
        },
        metadata: {
          reservationId,
          spotId: reservation.spotId,
          payerUserId: reservation.reservedByUserId,
          ownerUserId: reservation.spotOwnerId,
        },
      });

      // Update reservation with payment info
      await db.doc(`reservations/${reservationId}`).update({
        stripePaymentIntentId: paymentIntent.id,
        platformFeeCents,
        ownerPayoutCents: totalChargeCents - platformFeeCents,
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: totalChargeCents,
      };
    } catch (error: any) {
      if (error instanceof functions.https.HttpsError) throw error;
      console.error('Error creating PaymentIntent:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Error al procesar el pago'
      );
    }
  }
);
