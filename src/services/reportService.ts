import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export type ReportReason =
  | 'spot_not_found'
  | 'fake_photo'
  | 'wrong_price'
  | 'spam'
  | 'other';

export const REPORT_REASONS: { key: ReportReason; label: string }[] = [
  { key: 'spot_not_found', label: 'La plaza no existe o no está libre' },
  { key: 'fake_photo',     label: 'La foto no corresponde a la plaza' },
  { key: 'wrong_price',    label: 'El precio es incorrecto o engañoso' },
  { key: 'spam',           label: 'Es spam o publicidad falsa' },
  { key: 'other',          label: 'Otro motivo' },
];

export async function reportSpot(
  spotId: string,
  reporterId: string,
  reason: ReportReason
): Promise<void> {
  // Evitar reportes duplicados del mismo usuario
  const existing = await getDocs(
    query(
      collection(db, 'reports'),
      where('spotId', '==', spotId),
      where('reporterId', '==', reporterId)
    )
  );
  if (!existing.empty) {
    throw new Error('Ya has reportado esta plaza anteriormente.');
  }

  await addDoc(collection(db, 'reports'), {
    spotId,
    reporterId,
    reason,
    resolved: false,
    createdAt: serverTimestamp(),
  });
}

export async function hasUserReported(spotId: string, userId: string): Promise<boolean> {
  const snap = await getDocs(
    query(
      collection(db, 'reports'),
      where('spotId', '==', spotId),
      where('reporterId', '==', userId)
    )
  );
  return !snap.empty;
}
