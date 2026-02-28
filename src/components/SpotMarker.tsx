import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { Spot } from '../types/spot';
import { formatPricePerHour } from '../utils/formatCurrency';

interface Props {
  spot: Spot;
  onPress: (spot: Spot) => void;
}

export default function SpotMarker({ spot, onPress }: Props) {
  const markerColor = spot.status === 'available' ? '#4CAF50' : '#FF9800';

  return (
    <Marker
      coordinate={{
        latitude: spot.location.latitude,
        longitude: spot.location.longitude,
      }}
      onPress={() => onPress(spot)}
      tracksViewChanges={false}
    >
      <View style={[styles.marker, { backgroundColor: markerColor }]}>
        <Text style={styles.markerText}>P</Text>
      </View>
      <Callout>
        <View style={styles.callout}>
          <Text style={styles.calloutTitle} numberOfLines={1}>
            {spot.description || 'Plaza disponible'}
          </Text>
          <Text style={styles.calloutPrice}>
            {formatPricePerHour(spot.pricePerHourCents)}
          </Text>
          {spot.averageRating > 0 && (
            <Text style={styles.calloutRating}>
              {'★'.repeat(Math.round(spot.averageRating))} ({spot.ratingCount})
            </Text>
          )}
          <Text style={styles.calloutAction}>Toca para ver detalles</Text>
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  markerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  callout: {
    padding: 8,
    minWidth: 150,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  calloutPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90D9',
    marginBottom: 2,
  },
  calloutRating: {
    fontSize: 12,
    color: '#FFA000',
    marginBottom: 4,
  },
  calloutAction: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
});
