import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Spot } from '../../types/spot';
import { subscribeToSpot } from '../../services/spotService';
import { reserveSpot } from '../../services/reservationService';
import { useAuth } from '../../hooks/useAuth';
import { formatPricePerHour, formatCents } from '../../utils/formatCurrency';
import { getSubscriptionStatus } from '../../services/subscriptionService';
import {
  reportSpot,
  hasUserReported,
  REPORT_REASONS,
  ReportReason,
} from '../../services/reportService';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'SpotDetails'>;

export default function SpotDetailsScreen({ route, navigation }: Props) {
  const { spotId } = route.params;
  const { user } = useAuth();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [canReserve, setCanReserve] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToSpot(spotId, (updatedSpot) => {
      setSpot(updatedSpot);
      setLoading(false);
    });
    return unsubscribe;
  }, [spotId]);

  useEffect(() => {
    if (!user) return;
    getSubscriptionStatus(user.uid).then((status) => {
      setCanReserve(status.tier !== 'free');
    });
    hasUserReported(spotId, user.uid).then(setAlreadyReported);
  }, [user, spotId]);

  const handleReport = async (reason: ReportReason) => {
    if (!user) return;
    setReporting(true);
    try {
      await reportSpot(spotId, user.uid, reason);
      setAlreadyReported(true);
      setReportModalVisible(false);
      Alert.alert(
        'Reporte enviado',
        'Gracias por avisar. Revisaremos esta plaza y tomaremos medidas si es necesario.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      setReportModalVisible(false);
      Alert.alert('Error', error.message || 'No se pudo enviar el reporte');
    } finally {
      setReporting(false);
    }
  };

  const handleReserve = async () => {
    if (!user || !spot) return;

    Alert.alert(
      'Reservar plaza',
      `¿Quieres reservar esta plaza a ${formatPricePerHour(spot.pricePerHourCents)}?\n\nEl cobro mínimo es de 1 hora.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reservar',
          onPress: async () => {
            setReserving(true);
            try {
              await reserveSpot(spotId, user.uid);
              Alert.alert(
                '¡Plaza reservada!',
                'El temporizador ha comenzado. Dirígete a la plaza.',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('MainTabs'),
                  },
                ]
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo reservar');
            } finally {
              setReserving(false);
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

  if (!spot) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Plaza no encontrada</Text>
      </View>
    );
  }

  const isOwner = user?.uid === spot.ownerId;
  const isAvailable = spot.status === 'available';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Photo or map */}
      {spot.photoURL ? (
        <Image source={{ uri: spot.photoURL }} style={styles.photo} />
      ) : (
        <MapView
          style={styles.photo}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: spot.location.latitude,
            longitude: spot.location.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
        >
          <Marker
            coordinate={{
              latitude: spot.location.latitude,
              longitude: spot.location.longitude,
            }}
          />
        </MapView>
      )}

      {/* Status badge */}
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: isAvailable ? '#4CAF50' : '#FF9800' },
        ]}
      >
        <Text style={styles.statusText}>
          {isAvailable ? 'Disponible' : 'Reservada'}
        </Text>
      </View>

      {/* Details */}
      <View style={styles.details}>
        <Text style={styles.price}>
          {formatPricePerHour(spot.pricePerHourCents)}
        </Text>

        <Text style={styles.description}>{spot.description}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Dirección</Text>
          <Text style={styles.infoValue}>{spot.address}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Compartida por</Text>
          <Text style={styles.infoValue}>{spot.ownerDisplayName}</Text>
        </View>

        {spot.averageRating > 0 && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Valoración</Text>
            <Text style={styles.ratingText}>
              {'★'.repeat(Math.round(spot.averageRating))}
              {'☆'.repeat(5 - Math.round(spot.averageRating))}{' '}
              ({spot.ratingCount} valoraciones)
            </Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Cobro mínimo</Text>
          <Text style={styles.infoValue}>
            {formatCents(spot.pricePerHourCents)} (1 hora)
          </Text>
        </View>
      </View>

      {/* Reserve button */}
      {isAvailable && !isOwner && canReserve && (
        <TouchableOpacity
          style={[styles.reserveButton, reserving && styles.buttonDisabled]}
          onPress={handleReserve}
          disabled={reserving}
        >
          {reserving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.reserveButtonText}>Reservar esta plaza</Text>
          )}
        </TouchableOpacity>
      )}

      {isAvailable && !isOwner && !canReserve && (
        <TouchableOpacity
          style={styles.subscribePrompt}
          onPress={() => navigation.navigate('Subscription')}
        >
          <Text style={styles.subscribePromptTitle}>
            Suscríbete para reservar
          </Text>
          <Text style={styles.subscribePromptSub}>
            Desde 4,99€/mes — Ver planes →
          </Text>
        </TouchableOpacity>
      )}

      {isOwner && (
        <View style={styles.ownerBanner}>
          <Text style={styles.ownerText}>
            Esta es tu plaza. Espera a que alguien la reserve.
          </Text>
        </View>
      )}

      {!isAvailable && !isOwner && (
        <View style={styles.unavailableBanner}>
          <Text style={styles.unavailableText}>
            Esta plaza ya está reservada
          </Text>
        </View>
      )}

      {/* Botón reportar — solo visible para otros usuarios, no el owner */}
      {!isOwner && (
        <TouchableOpacity
          style={[styles.reportButton, alreadyReported && styles.reportedButton]}
          onPress={() => {
            if (!alreadyReported) setReportModalVisible(true);
          }}
          disabled={alreadyReported}
        >
          <Text style={[styles.reportButtonText, alreadyReported && styles.reportedButtonText]}>
            {alreadyReported ? 'Plaza reportada' : 'Reportar esta plaza'}
          </Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />

      {/* Modal de motivos de reporte */}
      <Modal
        visible={reportModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setReportModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Reportar plaza</Text>
            <View style={{ width: 60 }} />
          </View>

          <Text style={styles.modalSubtitle}>
            ¿Por qué quieres reportar esta plaza?
          </Text>

          {REPORT_REASONS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.reasonItem, reporting && styles.buttonDisabled]}
              onPress={() => handleReport(item.key)}
              disabled={reporting}
            >
              {reporting ? (
                <ActivityIndicator size="small" color="#4A90D9" />
              ) : (
                <Text style={styles.reasonText}>{item.label}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
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
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  photo: {
    width,
    height: 220,
  },
  statusBadge: {
    position: 'absolute',
    top: 190,
    right: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  details: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    padding: 24,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A90D9',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  ratingText: {
    fontSize: 14,
    color: '#FFA000',
  },
  reserveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    paddingVertical: 18,
    marginHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  reserveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  ownerBanner: {
    backgroundColor: '#E8F0FE',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 8,
    alignItems: 'center',
  },
  ownerText: {
    color: '#4A90D9',
    fontSize: 14,
    textAlign: 'center',
  },
  unavailableBanner: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 8,
    alignItems: 'center',
  },
  unavailableText: {
    color: '#FF9800',
    fontSize: 14,
    textAlign: 'center',
  },
  subscribePrompt: {
    backgroundColor: '#4A90D9',
    borderRadius: 14,
    paddingVertical: 18,
    marginHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  subscribePromptTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  subscribePromptSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  reportButton: {
    marginHorizontal: 24,
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E53935',
  },
  reportedButton: {
    borderColor: '#ccc',
  },
  reportButtonText: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: '500',
  },
  reportedButtonText: {
    color: '#aaa',
  },
  modal: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalCancel: {
    fontSize: 15,
    color: '#666',
    width: 60,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  reasonItem: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    minHeight: 56,
    justifyContent: 'center',
  },
  reasonText: {
    fontSize: 16,
    color: '#333',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
