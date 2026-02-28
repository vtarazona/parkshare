import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { checkRateLimit } from '../utils/rateLimiter';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const PLATFORM_FEE_RATE = 0.20;

export const createPaymentIntent = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión');
  }

  const { reservationId } = request.data;
  if (!reservationId) {
    throw new HttpsError('invalid-argument', 'Se requiere reservationId');
  }

  await checkRateLimit(request.auth.uid, 'createPaymentIntent', 5, 60);

  try {
    const db = admin.firestore();

    const reservationDoc = await db.doc(`reservations/${reservationId}`).get();
    if (!reservationDoc.exists) {
      throw new HttpsError('not-found', 'Reserva no encontrada');
    }

    const reservation = reservationDoc.data()!;
    if (reservation.reservedByUserId !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'No autorizado');
    }

    const totalChargeCents = reservation.totalChargeCents;
    if (!totalChargeCents || totalChargeCents <= 0) {
      throw new HttpsError('failed-precondition', 'El importe no es válido');
    }

    const ownerDoc = await db.doc(`users/${reservation.spotOwnerId}`).get();
    const ownerData = ownerDoc.data();
    if (!ownerData?.stripeConnectAccountId) {
      throw new HttpsError('failed-precondition', 'El propietario no tiene pagos configurados');
    }

    const payerDoc = await db.doc(`users/${reservation.reservedByUserId}`).get();
    const payerData = payerDoc.data();
    let customerId = payerData?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: payerData?.email,
        metadata: { userId: reservation.reservedByUserId },
      });
      customerId = customer.id;
      await db.doc(`users/${reservation.reservedByUserId}`).update({ stripeCustomerId: customerId });
    }

    const platformFeeCents = Math.round(totalChargeCents * PLATFORM_FEE_RATE);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalChargeCents,
      currency: 'eur',
      customer: customerId,
      application_fee_amount: platformFeeCents,
      transfer_data: { destination: ownerData.stripeConnectAccountId },
      metadata: {
        reservationId,
        spotId: reservation.spotId,
        payerUserId: reservation.reservedByUserId,
        ownerUserId: reservation.spotOwnerId,
      },
    });

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
    if (error instanceof HttpsError) throw error;
    console.error('Error creating PaymentIntent:', error);
    throw new HttpsError('internal', 'Error al procesar el pago');
  }
});
