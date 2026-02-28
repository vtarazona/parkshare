import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useAppStore } from '../stores/appStore';
import { subscribeToActiveReservation } from '../services/reservationService';

export function useActiveReservation() {
  const { user } = useAuth();
  const { activeReservation, setActiveReservation } = useAppStore();

  useEffect(() => {
    if (!user) {
      setActiveReservation(null);
      return;
    }

    const unsubscribe = subscribeToActiveReservation(user.uid, (reservation) => {
      setActiveReservation(reservation);
    });

    return unsubscribe;
  }, [user]);

  return activeReservation;
}
