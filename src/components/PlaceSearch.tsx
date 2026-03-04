import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from 'react-native';

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface PlaceResult {
  latitude: number;
  longitude: number;
  address: string;
}

interface PlaceSearchProps {
  onSelectPlace: (result: PlaceResult) => void;
  onClear?: () => void;
}

export default function PlaceSearch({ onSelectPlace, onClear }: PlaceSearchProps) {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPredictions = async (text: string) => {
    if (text.length < 3) {
      setPredictions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          text
        )}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY}&language=es&components=country:es&types=geocode|establishment`
      );
      const data = await res.json();
      if (data.status === 'OK') {
        setPredictions(data.predictions ?? []);
      } else {
        setPredictions([]);
      }
    } catch {
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(text), 400);
  };

  const handleSelect = async (prediction: PlacePrediction) => {
    Keyboard.dismiss();
    setQuery(prediction.description);
    setPredictions([]);
    setFocused(false);

    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY}&fields=geometry`
      );
      const data = await res.json();
      if (data.status === 'OK') {
        const { lat, lng } = data.result.geometry.location;
        onSelectPlace({ latitude: lat, longitude: lng, address: prediction.description });
      }
    } catch {
      // silently fail — user can try again
    }
  };

  const handleClear = () => {
    setQuery('');
    setPredictions([]);
    setFocused(false);
    Keyboard.dismiss();
    onClear?.();
  };

  const showList = focused && (predictions.length > 0 || loading);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="Buscar dirección o lugar..."
          placeholderTextColor="#aaa"
          returnKeyType="search"
        />
        {loading ? (
          <ActivityIndicator size="small" color="#4A90D9" style={styles.clearBtn} />
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {showList && (
        <View style={styles.listContainer}>
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.place_id}
            keyboardShouldPersistTaps="always"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.predictionItem}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.predictionMain}>
                  {item.structured_formatting?.main_text ?? item.description}
                </Text>
                {item.structured_formatting?.secondary_text ? (
                  <Text style={styles.predictionSub}>
                    {item.structured_formatting.secondary_text}
                  </Text>
                ) : null}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  inputRowFocused: {
    borderWidth: 1.5,
    borderColor: '#4A90D9',
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    padding: 0,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 4,
  },
  clearIcon: {
    fontSize: 14,
    color: '#999',
  },
  listContainer: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: 280,
    zIndex: 100,
    overflow: 'hidden',
  },
  predictionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  predictionMain: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  predictionSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
});
