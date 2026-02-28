import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Spot } from '../types/spot';
import { formatPricePerHour } from '../utils/formatCurrency';

interface Props {
  spot: Spot;
  distance?: number; // in km
  onViewDetails: (spotId: string) => void;
}

export default function SpotCard({ spot, distance, onViewDetails }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {spot.photoURL ? (
          <Image source={{ uri: spot.photoURL }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Text style={styles.photoPlaceholderText}>P</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.description} numberOfLines={2}>
            {spot.description || 'Plaza de parking'}
          </Text>
          <Text style={styles.address} numberOfLines={1}>
            {spot.address}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.price}>
              {formatPricePerHour(spot.pricePerHourCents)}
            </Text>
            {distance !== undefined && (
              <Text style={styles.distance}>
                {distance < 1
                  ? `${Math.round(distance * 1000)} m`
                  : `${distance.toFixed(1)} km`}
              </Text>
            )}
          </View>
          {spot.averageRating > 0 && (
            <Text style={styles.rating}>
              {'★'.repeat(Math.round(spot.averageRating))}
              {'☆'.repeat(5 - Math.round(spot.averageRating))}{' '}
              ({spot.ratingCount})
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => onViewDetails(spot.id)}
      >
        <Text style={styles.buttonText}>Ver Detalles</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  photo: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 12,
  },
  photoPlaceholder: {
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A90D9',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  description: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  address: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90D9',
  },
  distance: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rating: {
    fontSize: 12,
    color: '#FFA000',
    marginTop: 2,
  },
  button: {
    backgroundColor: '#4A90D9',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
