import React, { useState, useRef, useCallback, useMemo } from 'react';
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
import MapFilters, { FilterState, DEFAULT_FILTERS } from '../../components/MapFilters';
import PlaceSearch from '../../components/PlaceSearch';
import { Spot } from '../../types/spot';
import { RootStackParamList } from '../../types/navigation';
import { distanceBetween } from '../../utils/geohash';
import { useAuth } from '../../hooks/useAuth';
import { trackEvent } from '../../services/analyticsService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MapScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { location, loading: locationLoading, refreshLocation } = useLocation();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const handleApplyFilters = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    trackEvent('map_filter_applied', user?.uid ?? null, {
      maxPricePerHour: newFilters.maxPricePerHour,
      radiusKm: newFilters.radiusKm,
      sortBy: newFilters.sortBy,
    });
  }, [user]);
  const [searchCenter, setSearchCenter] = useState<{ latitude: number; longitude: number } | null>(
    null
  );

  const center = searchCenter ?? location;

  const { spots, loading: spotsLoading } = useNearbySpots(
    center?.latitude ?? null,
    center?.longitude ?? null,
    filters.radiusKm
  );

  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const mapRef = useRef<MapView>(null);

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

  const filteredSpots = useMemo(() => {
    let result = [...spots];

    if (filters.maxPricePerHour !== null) {
      result = result.filter(
        (s) => s.pricePerHourCents <= filters.maxPricePerHour! * 100
      );
    }

    if (filters.sortBy === 'price') {
      result.sort((a, b) => a.pricePerHourCents - b.pricePerHourCents);
    } else if (filters.sortBy === 'rating') {
      result.sort((a, b) => b.averageRating - a.averageRating);
    } else {
      // distance
      result.sort((a, b) => {
        const da = getDistance(a) ?? Infinity;
        const db = getDistance(b) ?? Infinity;
        return da - db;
      });
    }

    return result;
  }, [spots, filters, getDistance]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.maxPricePerHour !== null) count++;
    if (filters.radiusKm !== DEFAULT_FILTERS.radiusKm) count++;
    if (filters.sortBy !== DEFAULT_FILTERS.sortBy) count++;
    return count;
  }, [filters]);

  const initialRegion: Region | undefined = center
    ? {
        latitude: center.latitude,
        longitude: center.longitude,
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
      setSearchCenter(null);
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

  const handleSelectPlace = useCallback(
    (result: { latitude: number; longitude: number; address: string }) => {
      setSearchCenter({ latitude: result.latitude, longitude: result.longitude });
      setSelectedSpot(null);
      mapRef.current?.animateToRegion(
        {
          latitude: result.latitude,
          longitude: result.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        600
      );
    },
    []
  );

  const handleClearSearch = useCallback(() => {
    setSearchCenter(null);
  }, []);

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
        <Text style={styles.errorSubtext}>
          Activa los permisos de ubicación en Ajustes para ver plazas cercanas.
        </Text>
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
        {filteredSpots.map((spot) => (
          <SpotMarker key={spot.id} spot={spot} onPress={handleSpotPress} />
        ))}
      </MapView>

      {/* Header: logo + búsqueda */}
      <View style={styles.header}>
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <View style={styles.searchWrapper}>
          <PlaceSearch onSelectPlace={handleSelectPlace} onClear={handleClearSearch} />
        </View>
      </View>

      {/* Badge de plazas encontradas */}
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {filteredSpots.length} plaza{filteredSpots.length !== 1 ? 's' : ''}
            {activeFilterCount > 0 ? ' (filtradas)' : ''}
          </Text>
        </View>
      </View>

      {/* Botones flotantes */}
      <View style={styles.floatingButtons}>
        <MapFilters
          filters={filters}
          onApply={handleApplyFilters}
          activeCount={activeFilterCount}
        />
        <TouchableOpacity style={styles.centerButton} onPress={handleCenterOnUser}>
          <Text style={styles.centerButtonText}>📍</Text>
        </TouchableOpacity>
      </View>

      {/* Tarjeta de plaza seleccionada */}
      {selectedSpot && (
        <View style={styles.cardContainer}>
          <SpotCard
            spot={selectedSpot}
            distance={getDistance(selectedSpot)}
            onViewDetails={handleViewDetails}
          />
        </View>
      )}

      {/* Estado vacío: no hay plazas con los filtros actuales */}
      {!spotsLoading && filteredSpots.length === 0 && spots.length > 0 && (
        <View style={styles.emptyFilter}>
          <Text style={styles.emptyFilterText}>
            No hay plazas con estos filtros. Prueba a ajustarlos.
          </Text>
        </View>
      )}

      {/* Estado vacío: no hay plazas en la zona */}
      {!spotsLoading && spots.length === 0 && (
        <View style={styles.emptyFilter}>
          <Text style={styles.emptyFilterText}>
            No hay plazas disponibles en esta zona ahora mismo.
          </Text>
        </View>
      )}

      {/* Indicador de carga */}
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
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
    alignItems: 'center',
    gap: 10,
    zIndex: 10,
  },
  headerLogo: {
    width: 100,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    overflow: 'hidden',
    flexShrink: 0,
  },
  searchWrapper: {
    flex: 1,
    zIndex: 20,
  },
  badgeRow: {
    position: 'absolute',
    top: 104,
    left: 16,
  },
  badge: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  floatingButtons: {
    position: 'absolute',
    bottom: 210,
    right: 16,
    gap: 10,
    alignItems: 'center',
  },
  centerButton: {
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
  emptyFilter: {
    position: 'absolute',
    bottom: 110,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  emptyFilterText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  spotsLoading: {
    position: 'absolute',
    top: 108,
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
