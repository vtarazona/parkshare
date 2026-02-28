import { useEffect, useState } from 'react';
import { Spot } from '../types/spot';
import { subscribeToNearbySpots } from '../services/spotService';

const DEFAULT_RADIUS_KM = 2;

export function useNearbySpots(
  latitude: number | null,
  longitude: number | null,
  radiusKm: number = DEFAULT_RADIUS_KM
) {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (latitude === null || longitude === null) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToNearbySpots(
      latitude,
      longitude,
      radiusKm,
      (nearbySpots) => {
        setSpots(nearbySpots);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [latitude, longitude, radiusKm]);

  return { spots, loading };
}
