import { create } from 'zustand';
import { UserProfile } from '../types/user';
import { Reservation } from '../types/reservation';

interface AppState {
  userProfile: UserProfile | null;
  activeReservation: Reservation | null;
  isLoading: boolean;

  setUserProfile: (profile: UserProfile | null) => void;
  setActiveReservation: (reservation: Reservation | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  userProfile: null,
  activeReservation: null,
  isLoading: false,

  setUserProfile: (profile) => set({ userProfile: profile }),
  setActiveReservation: (reservation) => set({ activeReservation: reservation }),
  setLoading: (loading) => set({ isLoading: loading }),
  reset: () => set({ userProfile: null, activeReservation: null, isLoading: false }),
}));
