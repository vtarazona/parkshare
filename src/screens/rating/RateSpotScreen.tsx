import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';
import { rateSpot } from '../../services/ratingService';
import StarRating from '../../components/StarRating';

type Props = NativeStackScreenProps<RootStackParamList, 'RateSpot'>;

export default function RateSpotScreen({ route, navigation }: Props) {
  const { spotId, reservationId } = route.params;
  const { user } = useAuth();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (stars === 0) {
      Alert.alert('Error', 'Por favor selecciona una valoración');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      await rateSpot(
        spotId,
        user.uid,
        reservationId,
        stars,
        comment.trim() || null
      );
      Alert.alert('¡Gracias!', 'Tu valoración ha sido enviada', [
        { text: 'OK', onPress: () => navigation.navigate('MainTabs') },
      ]);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo enviar la valoración');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigation.navigate('MainTabs');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.title}>¿Qué tal tu experiencia?</Text>
        <Text style={styles.subtitle}>
          Tu valoración ayuda a otros usuarios
        </Text>

        <View style={styles.starsContainer}>
          <StarRating
            rating={stars}
            size={48}
            editable
            onRate={setStars}
          />
        </View>

        {stars > 0 && (
          <Text style={styles.starLabel}>
            {stars === 1
              ? 'Muy mal'
              : stars === 2
              ? 'Regular'
              : stars === 3
              ? 'Bien'
              : stars === 4
              ? 'Muy bien'
              : 'Excelente'}
          </Text>
        )}

        <TextInput
          style={styles.input}
          placeholder="Añade un comentario (opcional)"
          placeholderTextColor="#999"
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={3}
          maxLength={300}
        />

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading || stars === 0}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Enviar Valoración</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Saltar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 32,
  },
  starsContainer: {
    marginBottom: 12,
  },
  starLabel: {
    fontSize: 16,
    color: '#FFA000',
    fontWeight: '600',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#333',
    width: '100%',
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: '#FFA000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  skipText: {
    color: '#999',
    fontSize: 14,
  },
});
