import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

/**
 * Create a Stripe Connect Express account for a spot owner.
 * Returns an onboarding URL to complete identity verification.
 */
export const createStripeConnectAccount = functions.https.onCall(
  async (data, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Debes iniciar sesión'
      );
    }

    const { userId } = data;
    if (userId !== context.auth.uid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'No autorizado'
      );
    }

    try {
      // Check if user already has a Connect account
      const userDoc = await admin
        .firestore()
        .doc(`users/${userId}`)
        .get();

      const userData = userDoc.data();
      if (userData?.stripeConnectAccountId) {
        // Generate new onboarding link for existing account
        const accountLink = await stripe.accountLinks.create({
          account: userData.stripeConnectAccountId,
          refresh_url: 'https://parkshare.app/connect/refresh',
          return_url: 'https://parkshare.app/connect/return',
          type: 'account_onboarding',
        });

        return {
          accountId: userData.stripeConnectAccountId,
          onboardingUrl: accountLink.url,
        };
      }

      // Create new Express account
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

      // Save account ID to user doc
      await admin.firestore().doc(`users/${userId}`).update({
        stripeConnectAccountId: account.id,
      });

      // Create onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: 'https://parkshare.app/connect/refresh',
        return_url: 'https://parkshare.app/connect/return',
        type: 'account_onboarding',
      });

      return {
        accountId: account.id,
        onboardingUrl: accountLink.url,
      };
    } catch (error: any) {
      console.error('Error creating Connect account:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Error al crear la cuenta de pagos'
      );
    }
  }
);
