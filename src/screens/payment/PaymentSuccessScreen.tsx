import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { formatCents } from '../../utils/formatCurrency';
import { useAuth } from '../../hooks/useAuth';
import { trackEvent } from '../../services/analyticsService';

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentSuccess'>;

export default function PaymentSuccessScreen({ route, navigation }: Props) {
  const { reservationId, amount, spotId } = route.params;
  const { user } = useAuth();

  useEffect(() => {
    trackEvent('payment_completed', user?.uid ?? null, {
      amountCents: amount,
      reservationId,
      spotId,
    });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.checkCircle}>
          <Text style={styles.check}>✓</Text>
        </View>

        <Text style={styles.title}>¡Pago exitoso!</Text>
        <Text style={styles.amount}>{formatCents(amount)}</Text>
        <Text style={styles.subtitle}>
          Gracias por usar ParkShare. El propietario recibirá su pago.
        </Text>

        <TouchableOpacity
          style={styles.rateButton}
          onPress={() =>
            navigation.replace('RateSpot', {
              spotId,
              reservationId,
            })
          }
        >
          <Text style={styles.rateButtonText}>Valorar la plaza</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('MainTabs')}
        >
          <Text style={styles.homeButtonText}>Volver al mapa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  check: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  amount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4A90D9',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  rateButton: {
    backgroundColor: '#FFA000',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  rateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  homeButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  homeButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});
