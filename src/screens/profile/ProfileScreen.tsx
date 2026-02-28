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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { logOut, getUserProfile } from '../../services/authService';
import { createConnectAccount } from '../../services/paymentService';
import { registerForPushNotifications } from '../../services/notificationService';
import { UserProfile } from '../../types/user';
import { RootStackParamList } from '../../types/navigation';
import { formatCents } from '../../utils/formatCurrency';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectLoading, setConnectLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadProfile();
    registerForPushNotifications(user.uid);
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPayouts = async () => {
    if (!user) return;
    setConnectLoading(true);
    try {
      const { onboardingUrl } = await createConnectAccount(user.uid);
      await Linking.openURL(onboardingUrl);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo configurar los pagos');
    } finally {
      setConnectLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          try {
            await logOut();
          } catch {
            Alert.alert('Error', 'No se pudo cerrar sesión');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.displayName || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user?.displayName || 'Usuario'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Earnings card — toca para ir al Wallet */}
      <TouchableOpacity
        style={styles.earningsCard}
        onPress={() => navigation.navigate('Wallet')}
        activeOpacity={0.8}
      >
        <Text style={styles.earningsLabel}>Ganancias totales</Text>
        <Text style={styles.earningsAmount}>
          {formatCents(profile?.totalEarnings || 0)}
        </Text>
        {profile?.averageRating ? (
          <Text style={styles.earningsRating}>
            {'★'.repeat(Math.round(profile.averageRating))} Valoración media
          </Text>
        ) : null}
        <Text style={styles.earningsLink}>Ver mi wallet →</Text>
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuración</Text>

        {/* Stripe Connect */}
        {profile?.stripeConnectAccountId ? (
          <View style={styles.menuItem}>
            <Text style={styles.menuIcon}>✅</Text>
            <View style={styles.menuInfo}>
              <Text style={styles.menuLabel}>Pagos configurados</Text>
              <Text style={styles.menuSub}>Stripe Connect activo</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleSetupPayouts}
            disabled={connectLoading}
          >
            <Text style={styles.menuIcon}>💰</Text>
            <View style={styles.menuInfo}>
              <Text style={styles.menuLabel}>Configurar cobros</Text>
              <Text style={styles.menuSub}>
                Necesario para recibir pagos al compartir plazas
              </Text>
            </View>
            {connectLoading ? (
              <ActivityIndicator size="small" color="#4A90D9" />
            ) : (
              <Text style={styles.menuArrow}>→</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Subscription')}
        >
          <Text style={styles.menuIcon}>⭐</Text>
          <View style={styles.menuInfo}>
            <Text style={styles.menuLabel}>Plan de suscripción</Text>
            <Text style={styles.menuSub}>
              {profile?.subscriptionTier === 'premium'
                ? 'Premium activo'
                : profile?.subscriptionTier === 'basic'
                ? 'Basic activo'
                : 'Plan Free — mejora tu plan'}
            </Text>
          </View>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.menuIcon}>👤</Text>
          <View style={styles.menuInfo}>
            <Text style={styles.menuLabel}>Editar perfil</Text>
          </View>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Text style={styles.menuIcon}>🚪</Text>
          <View style={styles.menuInfo}>
            <Text style={[styles.menuLabel, { color: '#E53935' }]}>
              Cerrar sesión
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* App info */}
      <View style={styles.appInfo}>
        <Text style={styles.appName}>ParkShare v1.0.0</Text>
        <Text style={styles.appDesc}>Comparte tu plaza, gana dinero</Text>
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
  header: {
    backgroundColor: '#4A90D9',
    paddingTop: 60,
    paddingBottom: 32,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  earningsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginTop: -16,
  },
  earningsLabel: {
    fontSize: 13,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  earningsAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginVertical: 4,
  },
  earningsRating: {
    fontSize: 13,
    color: '#FFA000',
  },
  earningsLink: {
    fontSize: 13,
    color: '#4A90D9',
    marginTop: 8,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  menuIcon: {
    fontSize: 22,
    marginRight: 14,
  },
  menuInfo: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  menuSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 18,
    color: '#ccc',
  },
  appInfo: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 8,
  },
  appName: {
    fontSize: 13,
    color: '#aaa',
    fontWeight: '500',
  },
  appDesc: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 2,
  },
});
