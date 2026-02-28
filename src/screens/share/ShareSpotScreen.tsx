import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useLocation } from '../../hooks/useLocation';
import { useAuth } from '../../hooks/useAuth';
import { createSpot } from '../../services/spotService';
import { uploadSpotPhoto } from '../../services/storageService';
import PhotoPicker from '../../components/PhotoPicker';
import { isValidPrice, priceToCents, isValidDescription } from '../../utils/validators';

const { width } = Dimensions.get('window');

export default function ShareSpotScreen() {
  const { location, loading: locationLoading } = useLocation();
  const { user } = useAuth();

  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [markerCoord, setMarkerCoord] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const mapRef = useRef<MapView>(null);

  const currentCoord = markerCoord || location;

  const handleMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarkerCoord({ latitude, longitude });
    reverseGeocode(latitude, longitude);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY}&language=es`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        setAddress(data.results[0].formatted_address);
      }
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  const handleShare = async () => {
    if (!currentCoord) {
      Alert.alert('Error', 'No se ha podido obtener la ubicación');
      return;
    }
    if (!isValidPrice(price)) {
      Alert.alert('Error', 'Introduce un precio válido (ej: 1,50)');
      return;
    }
    if (!isValidDescription(description)) {
      Alert.alert('Error', 'La descripción debe tener entre 3 y 200 caracteres');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión');
      return;
    }

    setLoading(true);
    try {
      let photoURL: string | null = null;

      // Create the spot first to get the ID for the photo path
      const spotId = await createSpot({
        ownerId: user.uid,
        ownerDisplayName: user.displayName || 'Usuario',
        latitude: currentCoord.latitude,
        longitude: currentCoord.longitude,
        address: address || 'Ubicación sin dirección',
        description: description.trim(),
        pricePerHourCents: priceToCents(price),
        photoURL: null,
      });

      // Upload photo if exists
      if (imageUri) {
        photoURL = await uploadSpotPhoto(imageUri, spotId);
        // TODO: Update spot doc with photoURL
      }

      setSuccess(true);
      setPrice('');
      setDescription('');
      setImageUri(null);
      setMarkerCoord(null);
      setAddress('');

      Alert.alert(
        '¡Plaza compartida!',
        'Tu plaza aparecerá en el mapa para otros usuarios. Recibirás un pago cuando alguien la use.',
        [{ text: 'OK', onPress: () => setSuccess(false) }]
      );
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo compartir la plaza. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (locationLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A90D9" />
        <Text style={styles.loadingText}>Obteniendo tu ubicación...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          No se pudo obtener tu ubicación. Activa el GPS.
        </Text>
      </View>
    );
  }

  const initialRegion: Region = {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Compartir mi plaza</Text>
          <Text style={styles.subtitle}>
            Arrastra el pin a la ubicación exacta de tu plaza
          </Text>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={initialRegion}
            showsUserLocation
            onPress={handleMapPress}
          >
            {currentCoord && (
              <Marker
                coordinate={currentCoord}
                draggable
                onDragEnd={(e) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  setMarkerCoord({ latitude, longitude });
                  reverseGeocode(latitude, longitude);
                }}
              >
                <View style={styles.markerPin}>
                  <Text style={styles.markerPinText}>P</Text>
                </View>
              </Marker>
            )}
          </MapView>
        </View>

        {/* Address */}
        {address ? (
          <View style={styles.addressBox}>
            <Text style={styles.addressLabel}>Dirección:</Text>
            <Text style={styles.addressText}>{address}</Text>
          </View>
        ) : null}

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Precio por hora (€)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 1,50"
            placeholderTextColor="#999"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ej: Plaza cubierta en garaje, fácil acceso"
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            maxLength={200}
          />

          <Text style={styles.label}>Foto de la plaza</Text>
          <PhotoPicker
            imageUri={imageUri}
            onImageSelected={setImageUri}
            onRemove={() => setImageUri(null)}
          />

          <TouchableOpacity
            style={[styles.shareButton, loading && styles.buttonDisabled]}
            onPress={handleShare}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.shareButtonText}>
                Compartir Plaza
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scroll: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  mapContainer: {
    height: 220,
    marginHorizontal: 16,
    marginTop: -8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  map: {
    flex: 1,
  },
  markerPin: {
    backgroundColor: '#4A90D9',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  markerPinText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addressBox: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
  },
  addressLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
  },
  form: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  shareButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
