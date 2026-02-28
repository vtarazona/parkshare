import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

interface LocationData {
  latitude: number;
  longitude: number;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function getLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) {
            setError('Permiso de ubicación denegado');
            setLoading(false);
            Alert.alert(
              'Ubicación necesaria',
              'ParkShare necesita acceso a tu ubicación para mostrar plazas cercanas. Activa el permiso en Ajustes.'
            );
          }
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (isMounted) {
          setLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          });
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError('No se pudo obtener la ubicación');
          setLoading(false);
        }
      }
    }

    getLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshLocation = async () => {
    setLoading(true);
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      setError(null);
    } catch (err) {
      setError('No se pudo actualizar la ubicación');
    } finally {
      setLoading(false);
    }
  };

  return { location, loading, error, refreshLocation };
}
