import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { getUserProfile } from '../../services/authService';
import { createConnectAccount } from '../../services/paymentService';
import { getReservationHistory } from '../../services/reservationService';
import { UserProfile } from '../../types/user';
import { Reservation } from '../../types/reservation';
import { formatCents } from '../../utils/formatCurrency';
import { formatDuration } from '../../utils/formatTime';

export default function WalletScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [userProfile, history] = await Promise.all([
        getUserProfile(user.uid),
        getReservationHistory(user.uid, true),
      ]);
      setProfile(userProfile);
      setTransactions(history);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSetupPayouts = async () => {
    if (!user) return;
    setConnectLoading(true);
    try {
      const { onboardingUrl } = await createConnectAccount(user.uid);
      await Linking.openURL(onboardingUrl);
    } catch {
      Alert.alert('Error', 'No se pudo configurar los cobros. Inténtalo de nuevo.');
    } finally {
      setConnectLoading(false);
    }
  };

  // Calculate stats
  const thisMonth = new Date();
  const monthlyEarnings = transactions
    .filter((r) => {
      if (!r.endedAt) return false;
      const d = new Date(r.endedAt.toMillis());
      return (
        d.getMonth() === thisMonth.getMonth() &&
        d.getFullYear() === thisMonth.getFullYear()
      );
    })
    .reduce((sum, r) => sum + (r.ownerPayoutCents || 0), 0);

  const totalEarnings = profile?.totalEarnings || 0;
  const hasConnectAccount = !!profile?.stripeConnectAccountId;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#4A90D9"
        />
      }
    >
      {/* Balance principal */}
      <View style={styles.balanceHeader}>
        <Text style={styles.balanceLabel}>Ganancias totales</Text>
        <Text style={styles.balanceAmount}>{formatCents(totalEarnings)}</Text>
        <Text style={styles.balanceSub}>80% del precio por hora al propietario</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatCents(monthlyEarnings)}</Text>
          <Text style={styles.statLabel}>Este mes</Text>
        </View>
        <View style={[styles.statCard, styles.statCardMiddle]}>
          <Text style={styles.statValue}>{transactions.length}</Text>
          <Text style={styles.statLabel}>Reservas completadas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {profile?.averageRating
              ? `${profile.averageRating.toFixed(1)} ★`
              : '—'}
          </Text>
          <Text style={styles.statLabel}>Valoración</Text>
        </View>
      </View>

      {/* Stripe Connect */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cuenta de cobros</Text>
        {hasConnectAccount ? (
          <View style={styles.connectActive}>
            <View style={styles.connectActiveIcon}>
              <Text style={styles.connectActiveIconText}>✓</Text>
            </View>
            <View style={styles.connectActiveInfo}>
              <Text style={styles.connectActiveTitle}>Stripe Connect activo</Text>
              <Text style={styles.connectActiveSub}>
                Recibirás los pagos automáticamente tras cada reserva
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.connectCard}>
            <Text style={styles.connectIcon}>💳</Text>
            <Text style={styles.connectTitle}>Configura tus cobros</Text>
            <Text style={styles.connectDesc}>
              Conecta tu cuenta bancaria con Stripe para recibir el dinero
              de tus plazas directamente.
            </Text>
            <TouchableOpacity
              style={[styles.connectButton, connectLoading && styles.buttonDisabled]}
              onPress={handleSetupPayouts}
              disabled={connectLoading}
            >
              {connectLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.connectButtonText}>Configurar cobros</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Withdrawal placeholder */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Retiro de fondos</Text>
        <View style={styles.withdrawCard}>
          <View style={styles.withdrawRow}>
            <Text style={styles.withdrawLabel}>Disponible para retirar</Text>
            <Text style={styles.withdrawAmount}>{formatCents(totalEarnings)}</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity
            style={[
              styles.withdrawButton,
              (!hasConnectAccount || totalEarnings === 0) && styles.buttonDisabled,
            ]}
            disabled={!hasConnectAccount || totalEarnings === 0}
            onPress={() =>
              Alert.alert(
                'Próximamente',
                'La función de retiro manual estará disponible pronto. Los pagos se transfieren automáticamente tras cada reserva.'
              )
            }
          >
            <Text style={styles.withdrawButtonText}>Solicitar retiro</Text>
          </TouchableOpacity>
          {!hasConnectAccount && (
            <Text style={styles.withdrawNote}>
              Configura tu cuenta de cobros para poder retirar fondos
            </Text>
          )}
        </View>
      </View>

      {/* Transaction history */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historial de ingresos</Text>
        {transactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🅿️</Text>
            <Text style={styles.emptyTitle}>Sin ingresos todavía</Text>
            <Text style={styles.emptyDesc}>
              Cuando alguien reserve tu plaza, verás los ingresos aquí.
            </Text>
          </View>
        ) : (
          transactions.map((tx) => (
            <View key={tx.id} style={styles.txCard}>
              <View style={styles.txLeft}>
                <View style={styles.txIconBox}>
                  <Text style={styles.txIcon}>🅿️</Text>
                </View>
                <View>
                  <Text style={styles.txTitle}>Plaza reservada</Text>
                  <Text style={styles.txDate}>
                    {tx.endedAt
                      ? new Date(tx.endedAt.toMillis()).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </Text>
                  {tx.durationMinutes != null && (
                    <Text style={styles.txDuration}>
                      {formatDuration(tx.durationMinutes)}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.txRight}>
                <Text style={styles.txAmount}>
                  +{formatCents(tx.ownerPayoutCents || 0)}
                </Text>
                <Text style={styles.txFee}>
                  -{formatCents(tx.platformFeeCents || 0)} comisión
                </Text>
              </View>
            </View>
          ))
        )}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceHeader: {
    backgroundColor: '#4CAF50',
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  balanceLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  balanceSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: -16,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statCardMiddle: {
    marginHorizontal: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  connectActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  connectActiveIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  connectActiveIconText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  connectActiveInfo: {
    flex: 1,
  },
  connectActiveTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 2,
  },
  connectActiveSub: {
    fontSize: 12,
    color: '#388E3C',
    lineHeight: 16,
  },
  connectCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  connectIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  connectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  connectDesc: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  connectButton: {
    backgroundColor: '#4A90D9',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  withdrawCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  withdrawRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  withdrawLabel: {
    fontSize: 14,
    color: '#666',
  },
  withdrawAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginBottom: 14,
  },
  withdrawButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  withdrawButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  withdrawNote: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
  },
  txCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  txIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txIcon: {
    fontSize: 18,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  txDate: {
    fontSize: 12,
    color: '#888',
  },
  txDuration: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 1,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 2,
  },
  txFee: {
    fontSize: 11,
    color: '#bbb',
  },
});
