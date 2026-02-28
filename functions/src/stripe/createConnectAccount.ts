import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export const createStripeConnectAccount = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión');
  }

  const { userId } = request.data;
  if (userId !== request.auth.uid) {
    throw new HttpsError('permission-denied', 'No autorizado');
  }

  try {
    const userDoc = await admin.firestore().doc(`users/${userId}`).get();
    const userData = userDoc.data();

    if (userData?.stripeConnectAccountId) {
      const accountLink = await stripe.accountLinks.create({
        account: userData.stripeConnectAccountId,
        refresh_url: 'https://parkshare.app/connect/refresh',
        return_url: 'https://parkshare.app/connect/return',
        type: 'account_onboarding',
      });
      return { accountId: userData.stripeConnectAccountId, onboardingUrl: accountLink.url };
    }

    const account = await stripe.accounts.create({
      type: 'express',
      country: 'ES',
      email: userData?.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
    });

    await admin.firestore().doc(`users/${userId}`).update({
      stripeConnectAccountId: account.id,
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'https://parkshare.app/connect/refresh',
      return_url: 'https://parkshare.app/connect/return',
      type: 'account_onboarding',
    });

    return { accountId: account.id, onboardingUrl: accountLink.url };
  } catch (error: any) {
    console.error('Error creating Connect account:', error);
    throw new HttpsError('internal', 'Error al crear la cuenta de pagos');
  }
});
