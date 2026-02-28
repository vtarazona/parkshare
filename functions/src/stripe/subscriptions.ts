import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { Expo } from 'expo-server-sdk';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const PRICE_IDS: Record<string, string> = {
  basic: process.env.STRIPE_PRICE_BASIC || 'price_basic_placeholder',
  premium: process.env.STRIPE_PRICE_PREMIUM || 'price_premium_placeholder',
};

export const createSubscription = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión');
  }

  const { plan } = request.data as { plan: 'basic' | 'premium' };
  if (!plan || !PRICE_IDS[plan]) {
    throw new HttpsError('invalid-argument', 'Plan no válido');
  }

  const db = admin.firestore();
  const userId = request.auth.uid;

  const userDoc = await db.doc(`users/${userId}`).get();
  const userData = userDoc.data() || {};
  let customerId: string = userData.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userData.email,
      metadata: { userId },
    });
    customerId = customer.id;
    await db.doc(`users/${userId}`).update({ stripeCustomerId: customerId });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    success_url: 'https://parkshare.app/subscription/success',
    cancel_url: 'https://parkshare.app/subscription/cancel',
    metadata: { userId, plan },
  });

  return { url: session.url };
});

export const cancelSubscription = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión');
  }

  const db = admin.firestore();
  const userId = request.auth.uid;

  const userDoc = await db.doc(`users/${userId}`).get();
  const userData = userDoc.data();
  const subscriptionId: string | null = userData?.stripeSubscriptionId || null;

  if (!subscriptionId) {
    throw new HttpsError('not-found', 'No tienes una suscripción activa');
  }

  await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });

  await db.doc(`users/${userId}`).update({
    subscriptionTier: 'free',
    stripeSubscriptionId: null,
    subscriptionExpiresAt: null,
  });

  return { success: true };
});

export const subscriptionWebhook = onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET || '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  const db = admin.firestore();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== 'subscription') break;

      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan;
      const subscriptionId = session.subscription as string;
      if (!userId || !plan) break;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await db.doc(`users/${userId}`).update({
        subscriptionTier: plan,
        stripeSubscriptionId: subscriptionId,
        subscriptionExpiresAt: admin.firestore.Timestamp.fromDate(
          new Date(subscription.current_period_end * 1000)
        ),
      });
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const usersSnap = await db
        .collection('users')
        .where('stripeCustomerId', '==', subscription.customer as string)
        .limit(1)
        .get();
      if (usersSnap.empty) break;
      await usersSnap.docs[0].ref.update({
        subscriptionExpiresAt: admin.firestore.Timestamp.fromDate(
          new Date(subscription.current_period_end * 1000)
        ),
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const usersSnap = await db
        .collection('users')
        .where('stripeCustomerId', '==', subscription.customer as string)
        .limit(1)
        .get();
      if (usersSnap.empty) break;
      await usersSnap.docs[0].ref.update({
        subscriptionTier: 'free',
        stripeSubscriptionId: null,
        subscriptionExpiresAt: null,
      });
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const usersSnap = await db
        .collection('users')
        .where('stripeCustomerId', '==', invoice.customer as string)
        .limit(1)
        .get();
      if (usersSnap.empty) break;

      const userDoc = usersSnap.docs[0];
      const userData = userDoc.data();
      await userDoc.ref.update({ subscriptionTier: 'free' });

      if (userData?.expoPushToken && Expo.isExpoPushToken(userData.expoPushToken)) {
        const expo = new Expo();
        await expo.sendPushNotificationsAsync([{
          to: userData.expoPushToken,
          sound: 'default',
          title: 'Pago de suscripción fallido',
          body: 'No pudimos cobrar tu suscripción. Tu cuenta ha pasado al plan gratuito.',
        }]);
      }
      break;
    }

    default:
      break;
  }

  res.json({ received: true });
});
