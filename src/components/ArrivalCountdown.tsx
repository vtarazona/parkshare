import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Timestamp } from 'firebase/firestore';

interface Props {
  arrivalDeadline: Timestamp;
  onExpired: () => void;
}

export default function ArrivalCountdown({ arrivalDeadline, onExpired }: Props) {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  useEffect(() => {
    const computeSeconds = () => {
      const remaining = Math.floor(
        (arrivalDeadline.toMillis() - Date.now()) / 1000
      );
      return Math.max(remaining, 0);
    };

    setSecondsLeft(computeSeconds());

    const interval = setInterval(() => {
      const s = computeSeconds();
      setSecondsLeft(s);
      if (s <= 0) {
        clearInterval(interval);
        onExpired();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [arrivalDeadline]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isUrgent = secondsLeft <= 60;

  return (
    <View style={[styles.container, isUrgent && styles.containerUrgent]}>
      <Text style={[styles.label, isUrgent && styles.labelUrgent]}>
        Tiempo para llegar
      </Text>
      <Text style={[styles.timer, isUrgent && styles.timerUrgent]}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </Text>
      <Text style={[styles.sublabel, isUrgent && styles.sublabelUrgent]}>
        {isUrgent
          ? 'Corre — la reserva expirará pronto'
          : 'Dirígete a la plaza antes de que expire'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF3E0',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  containerUrgent: {
    backgroundColor: '#FFEBEE',
    borderColor: '#E53935',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  labelUrgent: {
    color: '#E53935',
  },
  timer: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#FF9800',
    fontVariant: ['tabular-nums'],
  },
  timerUrgent: {
    color: '#E53935',
  },
  sublabel: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 6,
    textAlign: 'center',
  },
  sublabelUrgent: {
    color: '#E53935',
  },
});
