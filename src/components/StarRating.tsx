import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  rating: number;
  maxStars?: number;
  size?: number;
  editable?: boolean;
  onRate?: (rating: number) => void;
}

export default function StarRating({
  rating,
  maxStars = 5,
  size = 32,
  editable = false,
  onRate,
}: Props) {
  const stars = [];

  for (let i = 1; i <= maxStars; i++) {
    const isFilled = i <= rating;
    const star = (
      <TouchableOpacity
        key={i}
        onPress={() => editable && onRate?.(i)}
        disabled={!editable}
        activeOpacity={editable ? 0.6 : 1}
      >
        <Text style={[styles.star, { fontSize: size }]}>
          {isFilled ? '★' : '☆'}
        </Text>
      </TouchableOpacity>
    );
    stars.push(star);
  }

  return <View style={styles.container}>{stars}</View>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
  },
  star: {
    color: '#FFA000',
  },
});
