import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Timestamp } from 'firebase/firestore';
import { formatTimer } from '../utils/formatTime';
import { formatCents } from '../utils/formatCurrency';

interface Props {
  startedAt: Timestamp;
  pricePerHourCents: number;
}

export default function Timer({ startedAt, pricePerHourCents }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startMs = startedAt.toMillis();

    const updateElapsed = () => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startMs) / 1000);
      setElapsed(Math.max(0, elapsedSeconds));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  // Calculate running cost (minimum 1 hour charge)
  const hours = Math.max(elapsed / 3600, 1);
  const currentCostCents = Math.round(pricePerHourCents * hours);

  return (
    <View style={styles.container}>
      <View style={styles.timerBox}>
        <Text style={styles.label}>Tiempo</Text>
        <Text style={styles.timer}>{formatTimer(elapsed)}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.costBox}>
        <Text style={styles.label}>Coste actual</Text>
        <Text style={styles.cost}>{formatCents(currentCostCents)}</Text>
        <Text style={styles.note}>Mínimo 1h</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timerBox: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 50,
    backgroundColor: '#eee',
    marginHorizontal: 16,
  },
  costBox: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timer: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    fontVariant: ['tabular-nums'],
  },
  cost: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A90D9',
  },
  note: {
    fontSize: 10,
    color: '#aaa',
    marginTop: 2,
  },
});
