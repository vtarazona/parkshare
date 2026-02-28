import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

/**
 * Simple rate limiter using Firestore counters.
 * Prevents abuse of Cloud Functions by limiting calls per user per minute.
 */
export async function checkRateLimit(
  userId: string,
  action: string,
  maxCalls: number = 10,
  windowSeconds: number = 60
): Promise<void> {
  const db = admin.firestore();
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  const key = `${userId}_${action}`;
  const ref = db.collection('_rateLimits').doc(key);

  await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const data = doc.data() || { calls: [], updatedAt: now };

    // Keep only calls within the current window
    const recentCalls: number[] = (data.calls || []).filter(
      (ts: number) => ts > windowStart
    );

    if (recentCalls.length >= maxCalls) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        `Demasiadas peticiones. Espera ${windowSeconds} segundos.`
      );
    }

    recentCalls.push(now);
    tx.set(ref, { calls: recentCalls, updatedAt: now });
  });
}
