import { httpsCallable, getFunctions } from 'firebase/functions';
import app from '../config/firebase';

const functions = getFunctions(app, 'us-central1');

interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
}

interface ConnectAccountResponse {
  accountId: string;
  onboardingUrl: string;
}

/**
 * Create a Stripe PaymentIntent via Cloud Function.
 * Called when a reservation ends.
 */
export async function createPaymentIntent(
  reservationId: string
): Promise<PaymentIntentResponse> {
  const createPI = httpsCallable<
    { reservationId: string },
    PaymentIntentResponse
  >(functions, 'createPaymentIntent');

  const result = await createPI({ reservationId });
  return result.data;
}

/**
 * Set up Stripe Connect account for spot owner.
 * Returns an onboarding URL to open in browser/WebView.
 */
export async function createConnectAccount(
  userId: string
): Promise<ConnectAccountResponse> {
  const createAccount = httpsCallable<
    { userId: string },
    ConnectAccountResponse
  >(functions, 'createStripeConnectAccount');

  const result = await createAccount({ userId });
  return result.data;
}

/**
 * Create a Stripe Customer for the payer.
 */
export async function createStripeCustomer(
  userId: string,
  email: string
): Promise<string> {
  const createCustomer = httpsCallable<
    { userId: string; email: string },
    { customerId: string }
  >(functions, 'createStripeCustomer');

  const result = await createCustomer({ userId, email });
  return result.data.customerId;
}
