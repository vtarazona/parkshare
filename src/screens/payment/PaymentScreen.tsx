import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { createPaymentIntent } from '../../services/paymentService';
import { formatCents } from '../../utils/formatCurrency';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

export default function PaymentScreen({ route, navigation }: Props) {
  const { reservationId } = route.params;
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    try {
      const { clientSecret, amount: amountCents } =
        await createPaymentIntent(reservationId);
      setAmount(amountCents);

      const { error } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'ParkShare',
        style: 'alwaysDark',
      });

      if (error) {
        Alert.alert('Error', 'No se pudo inicializar el pago');
        return;
      }

      setLoading(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al preparar el pago');
      setLoading(false);
    }
  };

  const handlePay = async () => {
    setPaying(true);
    try {
      const { error } = await presentPaymentSheet();
      if (error) {
        if (error.code !== 'Canceled') {
          Alert.alert('Error', error.message || 'El pago ha fallado');
        }
      } else {
        navigation.replace('PaymentSuccess', {
          reservationId,
          amount,
        });
      }
    } catch (error: any) {
      Alert.alert('Error', 'Error inesperado en el pago');
    } finally {
      setPaying(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>💳</Text>
        </View>

        <Text style={styles.title}>Confirmar Pago</Text>

        {loading ? (
          <>
            <ActivityIndicator size="large" color="#4A90D9" />
            <Text style={styles.loadingText}>Preparando el pago...</Text>
          </>
        ) : (
          <>
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Total a pagar</Text>
              <Text style={styles.amount}>{formatCents(amount)}</Text>
              <Text style={styles.amountNote}>
                Incluye 20% de comisión de plataforma
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.payButton, paying && styles.buttonDisabled]}
              onPress={handlePay}
              disabled={paying}
            >
              {paying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.payButtonText}>
                  Pagar {formatCents(amount)}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.secureText}>
              Pago seguro procesado por Stripe
            </Text>
          </>
        )}
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
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#888',
  },
  amountBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  amountLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  amount: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#4A90D9',
  },
  amountNote: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 4,
  },
  payButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 48,
    alignItems: 'center',
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  secureText: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 16,
  },
});
