import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ─── Tipos de eventos ────────────────────────────────────────────────────────

export type AnalyticsEventName =
  | 'sign_up'
  | 'login'
  | 'logout'
  | 'spot_published'
  | 'spot_viewed'
  | 'reservation_created'
  | 'arrival_confirmed'
  | 'reservation_cancelled'
  | 'payment_completed'
  | 'subscription_viewed'
  | 'subscription_purchased'
  | 'subscription_cancelled'
  | 'map_filter_applied'
  | 'place_searched'
  | 'spot_rated'
  | 'wallet_viewed'
  | 'payout_requested';

interface EventProperties {
  [key: string]: string | number | boolean | null;
}

// ─── Registrar evento ────────────────────────────────────────────────────────

export async function trackEvent(
  eventName: AnalyticsEventName,
  userId: string | null,
  properties?: EventProperties
): Promise<void> {
  try {
    await addDoc(collection(db, 'analytics_events'), {
      event: eventName,
      userId: userId ?? 'anonymous',
      properties: properties ?? {},
      timestamp: serverTimestamp(),
    });
  } catch {
    // Analytics nunca debe romper la app
  }
}

// ─── Consultas de métricas ───────────────────────────────────────────────────

export interface DailyMetrics {
  date: string;
  signUps: number;
  logins: number;
  spotsPublished: number;
  reservations: number;
  paymentsCompleted: number;
  revenue: number; // en céntimos
}

export async function getMetricsLast30Days(adminUserId: string): Promise<DailyMetrics[]> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const q = query(
    collection(db, 'analytics_events'),
    where('timestamp', '>=', Timestamp.fromDate(since)),
    orderBy('timestamp', 'asc'),
    limit(5000)
  );

  const snap = await getDocs(q);
  const byDay: Record<string, DailyMetrics> = {};

  snap.forEach((doc) => {
    const data = doc.data();
    const ts: Timestamp = data.timestamp;
    if (!ts) return;
    const date = ts.toDate().toISOString().split('T')[0];

    if (!byDay[date]) {
      byDay[date] = {
        date,
        signUps: 0,
        logins: 0,
        spotsPublished: 0,
        reservations: 0,
        paymentsCompleted: 0,
        revenue: 0,
      };
    }

    switch (data.event as AnalyticsEventName) {
      case 'sign_up':
        byDay[date].signUps++;
        break;
      case 'login':
        byDay[date].logins++;
        break;
      case 'spot_published':
        byDay[date].spotsPublished++;
        break;
      case 'reservation_created':
        byDay[date].reservations++;
        break;
      case 'payment_completed':
        byDay[date].paymentsCompleted++;
        byDay[date].revenue += data.properties?.amountCents ?? 0;
        break;
    }
  });

  return Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getTotalStats(): Promise<{
  totalUsers: number;
  totalReservations: number;
  totalRevenueCents: number;
  totalSpotsPublished: number;
}> {
  const q = query(
    collection(db, 'analytics_events'),
    orderBy('timestamp', 'desc'),
    limit(10000)
  );

  const snap = await getDocs(q);
  const stats = {
    totalUsers: 0,
    totalReservations: 0,
    totalRevenueCents: 0,
    totalSpotsPublished: 0,
  };

  const uniqueUsers = new Set<string>();

  snap.forEach((doc) => {
    const data = doc.data();
    if (data.userId && data.userId !== 'anonymous') uniqueUsers.add(data.userId);

    switch (data.event as AnalyticsEventName) {
      case 'reservation_created':
        stats.totalReservations++;
        break;
      case 'payment_completed':
        stats.totalRevenueCents += data.properties?.amountCents ?? 0;
        break;
      case 'spot_published':
        stats.totalSpotsPublished++;
        break;
    }
  });

  stats.totalUsers = uniqueUsers.size;
  return stats;
}
