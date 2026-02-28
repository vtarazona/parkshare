import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export const stripeWebhook = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    res.status(400).send('Missing stripe-signature header');
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  const db = admin.firestore();

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { reservationId, ownerUserId } = paymentIntent.metadata;

        if (reservationId) {
          await db.doc(`reservations/${reservationId}`).update({ status: 'completed' });

          const ownerPayoutCents =
            paymentIntent.amount - (paymentIntent.application_fee_amount || 0);

          await db.doc(`users/${ownerUserId}`).update({
            totalEarnings: admin.firestore.FieldValue.increment(ownerPayoutCents),
          });

          console.log(`Payment succeeded for reservation ${reservationId}. Amount: ${paymentIntent.amount}`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { reservationId } = paymentIntent.metadata;
        if (reservationId) {
          console.error(`Payment failed for reservation ${reservationId}: ${paymentIntent.last_payment_error?.message}`);
        }
        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        const usersSnapshot = await db
          .collection('users')
          .where('stripeConnectAccountId', '==', account.id)
          .limit(1)
          .get();

        if (!usersSnapshot.empty) {
          await usersSnapshot.docs[0].ref.update({
            stripeConnectVerified: account.charges_enabled,
          });
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});
