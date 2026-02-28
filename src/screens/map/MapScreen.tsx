import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLocation } from '../../hooks/useLocation';
import { useNearbySpots } from '../../hooks/useNearbySpots';
import SpotMarker from '../../components/SpotMarker';
import SpotCard from '../../components/SpotCard';
import { Spot } from '../../types/spot';
import { RootStackParamList } from '../../types/navigation';
import { distanceBetween } from '../../utils/geohash';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MapScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { location, loading: locationLoading, refreshLocation } = useLocation();
  const { spots, loading: spotsLoading } = useNearbySpots(
    location?.latitude ?? null,
    location?.longitude ?? null
  );
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const mapRef = useRef<MapView>(null);

  const initialRegion: Region | undefined = location
    ? {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }
    : undefined;

  const handleSpotPress = useCallback((spot: Spot) => {
    setSelectedSpot(spot);
    mapRef.current?.animateToRegion(
      {
        latitude: spot.location.latitude,
        longitude: spot.location.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      },
      500
    );
  }, []);

  const handleViewDetails = useCallback(
    (spotId: string) => {
      navigation.navigate('SpotDetails', { spotId });
    },
    [navigation]
  );

  const handleCenterOnUser = useCallback(() => {
    if (location) {
      mapRef.current?.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        500
      );
    }
  }, [location]);

  const getDistance = useCallback(
    (spot: Spot) => {
      if (!location) return undefined;
      return distanceBetween(
        location.latitude,
        location.longitude,
        spot.location.latitude,
        spot.location.longitude
      );
    },
    [location]
  );

  if (locationLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A90D9" />
        <Text style={styles.loadingText}>Obteniendo ubicación...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorIcon}>📍</Text>
        <Text style={styles.errorText}>No se pudo obtener tu ubicación</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshLocation}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={() => setSelectedSpot(null)}
      >
        {spots.map((spot) => (
          <SpotMarker key={spot.id} spot={spot} onPress={handleSpotPress} />
        ))}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{spots.length} plazas</Text>
        </View>
      </View>

      {/* Center on user button */}
      <TouchableOpacity style={styles.centerButton} onPress={handleCenterOnUser}>
        <Text style={styles.centerButtonText}>📍</Text>
      </TouchableOpacity>

      {/* Selected spot card */}
      {selectedSpot && (
        <View style={styles.cardContainer}>
          <SpotCard
            spot={selectedSpot}
            distance={getDistance(selectedSpot)}
            onViewDetails={handleViewDetails}
          />
        </View>
      )}

      {/* Loading indicator for spots */}
      {spotsLoading && (
        <View style={styles.spotsLoading}>
          <ActivityIndicator size="small" color="#4A90D9" />
          <Text style={styles.spotsLoadingText}>Buscando plazas...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4A90D9',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLogo: {
    width: 130,
    height: 52,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  badge: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  centerButton: {
    position: 'absolute',
    bottom: 200,
    right: 16,
    backgroundColor: '#fff',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  centerButtonText: {
    fontSize: 22,
  },
  cardContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
  },
  spotsLoading: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  spotsLoadingText: {
    fontSize: 13,
    color: '#666',
  },
});
