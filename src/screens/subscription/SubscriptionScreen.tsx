import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import {
  getSubscriptionStatus,
  subscribeToPlan,
  cancelSubscription,
  SubscriptionStatus,
} from '../../services/subscriptionService';

const PLANS = [
  {
    id: 'free' as const,
    name: 'Free',
    price: '0€',
    period: '',
    color: '#888',
    features: [
      'Publicar plazas ilimitadas',
      'Ver el mapa de plazas',
      'Sin poder reservar',
      'Con anuncios',
    ],
    canSubscribe: false,
  },
  {
    id: 'basic' as const,
    name: 'Basic',
    price: '4,99€',
    period: '/mes',
    color: '#4A90D9',
    features: [
      'Todo lo de Free',
      'Reservar hasta 10 plazas/mes',
      'Con anuncios',
    ],
    canSubscribe: true,
  },
  {
    id: 'premium' as const,
    name: 'Premium',
    price: '9,99€',
    period: '/mes',
    color: '#FF9800',
    features: [
      'Todo lo de Basic',
      'Reservas ilimitadas',
      'Sin anuncios',
      'Soporte prioritario',
    ],
    canSubscribe: true,
  },
];

export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadStatus();
  }, [user]);

  const loadStatus = async () => {
    if (!user) return;
    try {
      const s = await getSubscriptionStatus(user.uid);
      setStatus(s);
    } catch (error) {
      console.error('Error loading subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: 'basic' | 'premium') => {
    if (!user) return;
    setActionLoading(plan);
    try {
      const { url } = await subscribeToPlan(plan);
      await Linking.openURL(url);
      // Reload status after returning
      await loadStatus();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo iniciar la suscripción');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar suscripción',
      '¿Estás seguro? Perderás acceso a las funciones de pago al final del periodo.',
      [
        { text: 'No, mantener', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            setActionLoading('cancel');
            try {
              await cancelSubscription();
              await loadStatus();
              Alert.alert('Listo', 'Tu suscripción ha sido cancelada.');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo cancelar');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  const currentTier = status?.tier || 'free';

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Elige tu plan</Text>
      <Text style={styles.subtitle}>
        Accede a más funciones y reserva plazas cuando quieras.
      </Text>

      {PLANS.map((plan) => {
        const isCurrent = currentTier === plan.id;
        const isDowngrade =
          (currentTier === 'premium' && plan.id === 'basic') ||
          (currentTier !== 'free' && plan.id === 'free');

        return (
          <View
            key={plan.id}
            style={[
              styles.planCard,
              isCurrent && { borderColor: plan.color, borderWidth: 2 },
              plan.id === 'premium' && styles.premiumCard,
            ]}
          >
            {plan.id === 'premium' && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>RECOMENDADO</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <View>
                <Text style={[styles.planName, { color: plan.color }]}>
                  {plan.name}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                  <Text style={styles.planPeriod}>{plan.period}</Text>
                </View>
              </View>
              {isCurrent && (
                <View style={[styles.currentBadge, { backgroundColor: plan.color }]}>
                  <Text style={styles.currentBadgeText}>Actual</Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {plan.features.map((feature, idx) => (
              <View key={idx} style={styles.featureRow}>
                <Text style={[styles.featureCheck, { color: plan.color }]}>
                  ✓
                </Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}

            {plan.canSubscribe && !isCurrent && !isDowngrade && (
              <TouchableOpacity
                style={[
                  styles.subscribeButton,
                  { backgroundColor: plan.color },
                  actionLoading === plan.id && styles.buttonDisabled,
                ]}
                onPress={() => handleSubscribe(plan.id as 'basic' | 'premium')}
                disabled={actionLoading !== null}
              >
                {actionLoading === plan.id ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.subscribeButtonText}>
                    Suscribirse a {plan.name}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {isCurrent && plan.id !== 'free' && (
              <TouchableOpacity
                style={[styles.cancelButton, actionLoading === 'cancel' && styles.buttonDisabled]}
                onPress={handleCancel}
                disabled={actionLoading !== null}
              >
                {actionLoading === 'cancel' ? (
                  <ActivityIndicator color="#E53935" />
                ) : (
                  <Text style={styles.cancelButtonText}>Cancelar suscripción</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {status && status.tier === 'basic' && (
        <View style={styles.usageCard}>
          <Text style={styles.usageTitle}>Uso este mes</Text>
          <Text style={styles.usageCount}>
            {status.monthlyReservationCount} / 10 reservas
          </Text>
          <View style={styles.usageBar}>
            <View
              style={[
                styles.usageBarFill,
                {
                  width: `${Math.min(
                    (status.monthlyReservationCount / 10) * 100,
                    100
                  )}%`,
                  backgroundColor:
                    status.monthlyReservationCount >= 10
                      ? '#E53935'
                      : '#4A90D9',
                },
              ]}
            />
          </View>
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Los pagos se procesan de forma segura a través de Stripe. Puedes
          cancelar en cualquier momento.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  premiumCard: {
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  popularBadge: {
    backgroundColor: '#FF9800',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  popularText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  planPeriod: {
    fontSize: 14,
    color: '#888',
    marginLeft: 2,
  },
  currentBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureCheck: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
    width: 16,
  },
  featureText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  subscribeButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E53935',
  },
  cancelButtonText: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: '600',
  },
  usageCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  usageTitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
  },
  usageCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  usageBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  infoBox: {
    backgroundColor: '#E8F0FE',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#4A90D9',
    lineHeight: 18,
    textAlign: 'center',
  },
});
