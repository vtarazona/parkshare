import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ListRenderItem,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAppStore } from '../../stores/appStore';

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  emoji: string;
  title: string;
  description: string;
  color: string;
}

const slides: Slide[] = [
  {
    id: '1',
    emoji: '🅿️',
    title: 'Bienvenido a ParkShare',
    description:
      'La app que conecta a quienes dejan libre su plaza con quienes necesitan aparcar. Ahorra tiempo y gana dinero con tu hueco.',
    color: '#4A90D9',
  },
  {
    id: '2',
    emoji: '🚗',
    title: 'Comparte tu plaza',
    description:
      '¿Te vas y dejas tu plaza libre? Publícala en segundos. La app detecta tu posición, tú fijas el precio y empiezas a ganar.',
    color: '#4CAF50',
  },
  {
    id: '3',
    emoji: '🔍',
    title: 'Encuentra aparcamiento',
    description:
      'Ve plazas disponibles cerca de ti en tiempo real. Reserva con un toque, navega hasta ella y confirma tu llegada en 5 minutos.',
    color: '#FF9800',
  },
  {
    id: '4',
    emoji: '💳',
    title: 'Empieza gratis',
    description:
      'Publicar plazas es siempre gratis. Con Basic o Premium buscas y reservas plazas de otros conductores. ¡La primera semana sin coste!',
    color: '#7B61FF',
  },
];

export default function OnboardingScreen() {
  const flatListRef = useRef<FlatList<Slide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [completing, setCompleting] = useState(false);
  const { userProfile, setUserProfile } = useAppStore();

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const goToNext = () => {
    if (activeIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    if (completing || !userProfile) return;
    setCompleting(true);
    try {
      await updateDoc(doc(db, 'users', userProfile.uid), { onboardingCompleted: true });
      setUserProfile({ ...userProfile, onboardingCompleted: true });
    } catch {
      // Even if the update fails, let the user continue
      if (userProfile) {
        setUserProfile({ ...userProfile, onboardingCompleted: true });
      }
    }
  };

  const renderItem: ListRenderItem<Slide> = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.emojiContainer, { backgroundColor: item.color + '20' }]}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>
      <Text style={[styles.title, { color: item.color }]}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  const activeSlide = slides[activeIndex];

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
      />

      {/* Dots */}
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  index === activeIndex ? activeSlide.color : '#D0D0D0',
                width: index === activeIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={completeOnboarding} style={styles.skipButton}>
          <Text style={styles.skipText}>Omitir</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goToNext}
          style={[styles.nextButton, { backgroundColor: activeSlide.color }]}
          disabled={completing}
        >
          <Text style={styles.nextText}>
            {activeIndex === slides.length - 1 ? 'Empezar' : 'Siguiente'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emojiContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    fontSize: 16,
    color: '#999',
  },
  nextButton: {
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 30,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
