import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Stripe functions
export { createStripeConnectAccount } from './stripe/createConnectAccount';
export { createPaymentIntent } from './stripe/createPaymentIntent';
export { stripeWebhook } from './stripe/webhooks';
export { createSubscription, cancelSubscription, subscriptionWebhook } from './stripe/subscriptions';

// Notification functions
export { onReservationChange } from './notifications/sendPushNotification';

// Scheduled functions
export { cleanupExpiredSpots } from './spots/cleanupExpiredSpots';
