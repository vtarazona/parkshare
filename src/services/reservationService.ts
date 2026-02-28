import {
  collection,
  doc,
  updateDoc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Reservation } from '../types/reservation';
import { checkReservationLimit, incrementReservationCount } from './subscriptionService';

const RESERVATIONS_COLLECTION = 'reservations';
const SPOTS_COLLECTION = 'spots';

/**
 * Reserve a spot atomically using a Firestore transaction.
 * Prevents double-booking by checking spot status inside the transaction.
 */
export async function reserveSpot(
  spotId: string,
  userId: string
): Promise<string> {
  // Verify subscription tier and monthly limit before reserving
  await checkReservationLimit(userId);

  const reservationId = await runTransaction(db, async (transaction) => {
    const spotRef = doc(db, SPOTS_COLLECTION, spotId);
    const spotDoc = await transaction.get(spotRef);

    if (!spotDoc.exists()) {
      throw new Error('La plaza no existe');
    }

    const spotData = spotDoc.data();
    if (spotData.status !== 'available') {
      throw new Error('Esta plaza ya no está disponible');
    }

    if (spotData.ownerId === userId) {
      throw new Error('No puedes reservar tu propia plaza');
    }

    // Create reservation — starts in awaiting_arrival with 5-minute deadline
    const reservationRef = doc(collection(db, RESERVATIONS_COLLECTION));
    const arrivalDeadline = Timestamp.fromMillis(Date.now() + 5 * 60 * 1000);
    const reservationData = {
      spotId,
      spotOwnerId: spotData.ownerId,
      reservedByUserId: userId,
      status: 'awaiting_arrival' as const,
      arrivalDeadline,
      arrivedAt: null,
      startedAt: null,
      endedAt: null,
      durationMinutes: null,
      totalChargeCents: null,
      platformFeeCents: null,
      ownerPayoutCents: null,
      stripePaymentIntentId: null,
      stripeTransferId: null,
      createdAt: serverTimestamp(),
    };

    transaction.set(reservationRef, reservationData);

    // Update spot status
    transaction.update(spotRef, {
      status: 'reserved',
      reservedBy: userId,
      reservationId: reservationRef.id,
    });

    return reservationRef.id;
  });

  // Increment monthly reservation counter (fire-and-forget)
  incrementReservationCount(userId).catch(console.error);

  return reservationId;
}

/**
 * Confirm the seeker has arrived at the spot.
 * Transitions the reservation from awaiting_arrival → active and starts the timer.
 */
export async function confirmArrival(reservationId: string): Promise<void> {
  const reservationRef = doc(db, RESERVATIONS_COLLECTION, reservationId);
  const reservationDoc = await getDoc(reservationRef);

  if (!reservationDoc.exists()) {
    throw new Error('Reserva no encontrada');
  }

  const data = reservationDoc.data();
  if (data.status !== 'awaiting_arrival') {
    throw new Error('La reserva no está en espera de llegada');
  }

  // Check the deadline hasn't passed
  const deadline = data.arrivalDeadline as Timestamp;
  if (Timestamp.now().toMillis() > deadline.toMillis()) {
    throw new Error('El tiempo de llegada ha expirado. La reserva ha sido cancelada.');
  }

  await updateDoc(reservationRef, {
    status: 'active',
    arrivedAt: serverTimestamp(),
    startedAt: serverTimestamp(),
  });
}

/**
 * End a reservation and calculate the charge.
 */
export async function endReservation(
  reservationId: string
): Promise<{ durationMinutes: number; totalChargeCents: number }> {
  const reservationRef = doc(db, RESERVATIONS_COLLECTION, reservationId);
  const reservationDoc = await getDoc(reservationRef);

  if (!reservationDoc.exists()) {
    throw new Error('Reserva no encontrada');
  }

  const data = reservationDoc.data();
  if (data.status !== 'active') {
    throw new Error('Esta reserva ya no está activa');
  }

  // Calculate duration
  const startedAt = data.startedAt as Timestamp;
  const now = Timestamp.now();
  const durationMs = now.toMillis() - startedAt.toMillis();
  const durationMinutes = Math.max(Math.ceil(durationMs / 60000), 1);

  // Get spot price
  const spotDoc = await getDoc(doc(db, SPOTS_COLLECTION, data.spotId));
  const pricePerHourCents = spotDoc.exists()
    ? spotDoc.data().pricePerHourCents
    : 100;

  // Calculate charge (minimum 1 hour)
  const hours = Math.max(durationMinutes / 60, 1);
  const totalChargeCents = Math.round(pricePerHourCents * hours);
  const platformFeeCents = Math.round(totalChargeCents * 0.20);
  const ownerPayoutCents = totalChargeCents - platformFeeCents;

  // Update reservation
  await updateDoc(reservationRef, {
    status: 'completed',
    endedAt: serverTimestamp(),
    durationMinutes,
    totalChargeCents,
    platformFeeCents,
    ownerPayoutCents,
  });

  // Free up the spot
  if (spotDoc.exists()) {
    await updateDoc(doc(db, SPOTS_COLLECTION, data.spotId), {
      status: 'expired',
      reservedBy: null,
      reservationId: null,
    });
  }

  return { durationMinutes, totalChargeCents };
}

/**
 * Cancel a reservation that is awaiting_arrival or active.
 * Frees the spot back to available.
 */
export async function cancelReservation(reservationId: string): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const reservationRef = doc(db, RESERVATIONS_COLLECTION, reservationId);
    const reservationDoc = await transaction.get(reservationRef);

    if (!reservationDoc.exists()) {
      throw new Error('Reserva no encontrada');
    }

    const data = reservationDoc.data();
    if (data.status === 'completed' || data.status === 'cancelled') {
      throw new Error('Esta reserva ya no se puede cancelar');
    }

    transaction.update(reservationRef, {
      status: 'cancelled',
      endedAt: serverTimestamp(),
    });

    const spotRef = doc(db, SPOTS_COLLECTION, data.spotId);
    transaction.update(spotRef, {
      status: 'available',
      reservedBy: null,
      reservationId: null,
    });
  });
}

/**
 * Get the user's active reservation (if any)
 */
export function subscribeToActiveReservation(
  userId: string,
  callback: (reservation: Reservation | null) => void
) {
  const q = query(
    collection(db, RESERVATIONS_COLLECTION),
    where('reservedByUserId', '==', userId),
    where('status', 'in', ['awaiting_arrival', 'active']),
    limit(1)
  );

  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback(null);
      return;
    }
    const doc = snapshot.docs[0];
    callback({ id: doc.id, ...doc.data() } as Reservation);
  });
}

/**
 * Get user's reservation history
 */
export async function getReservationHistory(
  userId: string,
  asOwner: boolean = false
): Promise<Reservation[]> {
  const field = asOwner ? 'spotOwnerId' : 'reservedByUserId';
  const q = query(
    collection(db, RESERVATIONS_COLLECTION),
    where(field, '==', userId),
    where('status', '==', 'completed'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Reservation)
  );
}
