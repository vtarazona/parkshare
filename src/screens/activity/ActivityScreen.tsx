import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { useActiveReservation } from '../../hooks/useActiveReservation';
import {
  endReservation,
  confirmArrival,
  cancelReservation,
  getReservationHistory,
} from '../../services/reservationService';
import { getSpot } from '../../services/spotService';
import Timer from '../../components/Timer';
import ArrivalCountdown from '../../components/ArrivalCountdown';
import { Reservation } from '../../types/reservation';
import { Spot } from '../../types/spot';
import { RootStackParamList } from '../../types/navigation';
import { formatCents } from '../../utils/formatCurrency';
import { formatDuration, formatDate } from '../../utils/formatTime';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ActivityScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const activeReservation = useActiveReservation();
  const [activeSpot, setActiveSpot] = useState<Spot | null>(null);
  const [history, setHistory] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [ending, setEnding] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (activeReservation) {
      getSpot(activeReservation.spotId).then(setActiveSpot);
    } else {
      setActiveSpot(null);
    }
  }, [activeReservation]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getReservationHistory(user.uid)
      .then(setHistory)
      .finally(() => setLoading(false));
  }, [user, activeReservation]);

  const handleConfirmArrival = async () => {
    if (!activeReservation) return;
    setConfirming(true);
    try {
      await confirmArrival(activeReservation.id);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo confirmar la llegada');
    } finally {
      setConfirming(false);
    }
  };

  const handleCancelReservation = () => {
    if (!activeReservation) return;
    Alert.alert(
      'Cancelar reserva',
      '¿Estás seguro? La plaza volverá a estar disponible para otros.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelReservation(activeReservation.id);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo cancelar');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleArrivalExpired = () => {
    Alert.alert(
      'Reserva expirada',
      'No llegaste a tiempo. La plaza ha vuelto a estar disponible.',
      [{ text: 'OK' }]
    );
  };

  const handleEndSession = () => {
    if (!activeReservation) return;

    Alert.alert(
      'Finalizar sesión',
      '¿Estás seguro de que quieres finalizar tu sesión de parking?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          style: 'destructive',
          onPress: async () => {
            setEnding(true);
            try {
              await endReservation(activeReservation.id);
              navigation.navigate('Payment', {
                reservationId: activeReservation.id,
              });
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo finalizar');
            } finally {
              setEnding(false);
            }
          },
        },
      ]
    );
  };

  const isAwaitingArrival =
    activeReservation?.status === 'awaiting_arrival';
  const isActive = activeReservation?.status === 'active';

  const renderHistoryItem = ({ item }: { item: Reservation }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyLeft}>
        <Text style={styles.historyDate}>
          {item.createdAt ? formatDate(item.createdAt) : '-'}
        </Text>
        <Text style={styles.historyDuration}>
          {item.durationMinutes ? formatDuration(item.durationMinutes) : '-'}
        </Text>
      </View>
      <Text style={styles.historyAmount}>
        {item.totalChargeCents ? formatCents(item.totalChargeCents) : '-'}
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Actividad</Text>
      </View>

      {/* Active reservation */}
      {activeReservation && activeSpot ? (
        <View style={styles.activeSection}>
          {/* Badge */}
          <View style={styles.activeBadge}>
            <View
              style={[
                styles.activeDot,
                isAwaitingArrival && { backgroundColor: '#FF9800' },
              ]}
            />
            <Text
              style={[
                styles.activeLabel,
                isAwaitingArrival && { color: '#FF9800' },
              ]}
            >
              {isAwaitingArrival ? 'En camino...' : 'Reserva activa'}
            </Text>
          </View>

          <Text style={styles.activeDescription}>
            {activeSpot.description || 'Plaza de parking'}
          </Text>
          <Text style={styles.activeAddress}>{activeSpot.address}</Text>

          {/* Awaiting arrival: countdown + confirm + cancel */}
          {isAwaitingArrival && activeReservation.arrivalDeadline && (
            <>
              <ArrivalCountdown
                arrivalDeadline={activeReservation.arrivalDeadline}
                onExpired={handleArrivalExpired}
              />
              <TouchableOpacity
                style={[
                  styles.arrivedButton,
                  confirming && styles.buttonDisabled,
                ]}
                onPress={handleConfirmArrival}
                disabled={confirming || cancelling}
              >
                {confirming ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.arrivedButtonText}>He llegado</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelButton, cancelling && styles.buttonDisabled]}
                onPress={handleCancelReservation}
                disabled={confirming || cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator color="#E53935" />
                ) : (
                  <Text style={styles.cancelButtonText}>Cancelar reserva</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Active: timer + end + cancel */}
          {isActive && activeReservation.startedAt && (
            <>
              <Timer
                startedAt={activeReservation.startedAt}
                pricePerHourCents={activeSpot.pricePerHourCents}
              />
              <TouchableOpacity
                style={[styles.endButton, ending && styles.buttonDisabled]}
                onPress={handleEndSession}
                disabled={ending || cancelling}
              >
                {ending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.endButtonText}>Finalizar y Pagar</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelButton, cancelling && styles.buttonDisabled]}
                onPress={handleCancelReservation}
                disabled={ending || cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator color="#E53935" />
                ) : (
                  <Text style={styles.cancelButtonText}>Cancelar reserva</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : (
        <View style={styles.noActive}>
          <Text style={styles.noActiveIcon}>🅿️</Text>
          <Text style={styles.noActiveText}>
            No tienes ninguna reserva activa
          </Text>
          <Text style={styles.noActiveSubtext}>
            Busca plazas disponibles en el mapa
          </Text>
        </View>
      )}

      {/* History */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Historial</Text>
        {loading ? (
          <ActivityIndicator color="#4A90D9" style={{ marginTop: 16 }} />
        ) : history.length === 0 ? (
          <Text style={styles.emptyHistory}>
            Aún no tienes reservas completadas
          </Text>
        ) : (
          history.map((item) => (
            <View key={item.id}>{renderHistoryItem({ item })}</View>
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#4A90D9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  activeSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  activeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  activeDescription: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  activeAddress: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  arrivedButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  arrivedButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  endButton: {
    backgroundColor: '#E53935',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  endButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E53935',
  },
  cancelButtonText: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: '600',
  },
  noActive: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  noActiveIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noActiveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  noActiveSubtext: {
    fontSize: 13,
    color: '#888',
  },
  historySection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  emptyHistory: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingVertical: 20,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  historyLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  historyDuration: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90D9',
  },
});
