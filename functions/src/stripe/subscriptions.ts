import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Stripe Price IDs — se crean en el dashboard de Stripe y se guardan como env vars
// stripe.prices.create({ unit_amount: 499, currency: 'eur', recurring: { interval: 'month' }, product_data: { name: 'Basic' } })
const PRICE_IDS: Record<string, string> = {
  basic: process.env.STRIPE_PRICE_BASIC || 'price_basic_placeholder',
  premium: process.env.STRIPE_PRICE_PREMIUM || 'price_premium_placeholder',
};


/**
 * Create a Stripe Checkout session for a subscription.
 */
export const createSubscription = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Debes iniciar sesión'
      );
    }

    const { plan } = data as { plan: 'basic' | 'premium' };
    if (!plan || !PRICE_IDS[plan]) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Plan no válido'
      );
    }

    const db = admin.firestore();
    const userId = context.auth.uid;

    // Get or create Stripe Customer
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

    // Create Checkout session
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
  }
);

/**
 * Cancel the active subscription for a user.
 */
export const cancelSubscription = functions.https.onCall(
  async (_data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Debes iniciar sesión'
      );
    }

    const db = admin.firestore();
    const userId = context.auth.uid;

    const userDoc = await db.doc(`users/${userId}`).get();
    const userData = userDoc.data();
    const subscriptionId: string | null =
      userData?.stripeSubscriptionId || null;

    if (!subscriptionId) {
      throw new functions.https.HttpsError(
        'not-found',
        'No tienes una suscripción activa'
      );
    }

    // Cancel at period end (no immediate cancellation)
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    await db.doc(`users/${userId}`).update({
      subscriptionTier: 'free',
      stripeSubscriptionId: null,
      subscriptionExpiresAt: null,
    });

    return { success: true };
  }
);

/**
 * Webhook handler for Stripe subscription events.
 * Register this as an HTTP endpoint in Stripe Dashboard.
 */
export const subscriptionWebhook = functions.https.onRequest(
  async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET || '';

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        webhookSecret
      );
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
        const currentPeriodEnd = new Date(
          subscription.current_period_end * 1000
        );

        await db.doc(`users/${userId}`).update({
          subscriptionTier: plan,
          stripeSubscriptionId: subscriptionId,
          subscriptionExpiresAt: admin.firestore.Timestamp.fromDate(
            currentPeriodEnd
          ),
        });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by stripeCustomerId
        const usersSnap = await db
          .collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();

        if (usersSnap.empty) break;

        const userRef = usersSnap.docs[0].ref;
        const currentPeriodEnd = new Date(
          subscription.current_period_end * 1000
        );

        await userRef.update({
          subscriptionExpiresAt: admin.firestore.Timestamp.fromDate(
            currentPeriodEnd
          ),
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const usersSnap = await db
          .collection('users')
          .where('stripeCustomerId', '==', customerId)
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
        const customerId = invoice.customer as string;

        const usersSnap = await db
          .collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();

        if (usersSnap.empty) break;

        const userDoc = usersSnap.docs[0];
        const userData = userDoc.data();

        // Downgrade to free on payment failure
        await userDoc.ref.update({ subscriptionTier: 'free' });

        // Notify user about failed payment
        if (userData?.expoPushToken) {
          const { Expo } = await import('expo-server-sdk');
          const expo = new Expo();
          if (Expo.isExpoPushToken(userData.expoPushToken)) {
            await expo.sendPushNotificationsAsync([{
              to: userData.expoPushToken,
              sound: 'default',
              title: 'Pago de suscripción fallido',
              body: 'No pudimos cobrar tu suscripción. Tu cuenta ha pasado al plan gratuito.',
            }]);
          }
        }
        break;
      }

      default:
        break;
    }

    res.json({ received: true });
  }
);
