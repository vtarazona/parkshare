# ParkShare — Plan Completo para Claude Code

## Instrucciones para Claude Code

Eres un desarrollador senior trabajando en ParkShare, una app móvil de React Native (Expo) que permite compartir plazas de aparcamiento en la calle en tiempo real a cambio de dinero. Lee este documento completo antes de hacer cualquier cambio. Contiene el estado actual del proyecto, lo que falta por implementar y las especificaciones técnicas detalladas.

---

## 1. Concepto del Producto

ParkShare es una plataforma donde:
- **Publisher** (el que se va): Indica que deja libre su plaza. La app geolocaliza el hueco y lo publica en el mapa.
- **Seeker** (el que busca): Ve plazas disponibles cercanas en un mapa, reserva una y navega hasta ella en 5 minutos.
- El publisher gana dinero, el seeker ahorra tiempo. La plataforma cobra un 20% de comisión.

---

## 2. Modelo de Negocio

### Suscripciones (3 niveles)

| Tier | Precio | Buscar/Reservar | Publicar | Límite reservas | Anuncios |
|------|--------|-----------------|----------|-----------------|----------|
| **Free** | 0€ | ❌ No | ✅ Sí | N/A | N/A |
| **Basic** | 4,99€/mes | ✅ Sí | ✅ Sí | 10/mes | Sí |
| **Premium** | 9,99€/mes | ✅ Sí | ✅ Sí | Ilimitado | No |

### Comisión
- **20% para la plataforma** en cada transacción
- **80% para el publisher**
- Propinas opcionales del seeker al publisher

---

## 3. Stack Tecnológico Actual

### Frontend (React Native / Expo)
- **Expo SDK 54** con React Native 0.81
- **React Navigation** (bottom tabs + native stack)
- **React Native Maps** (Google Maps)
- **Expo Location** (geolocalización)
- **Expo Image Picker** (fotos de plazas)
- **Expo Notifications** (push notifications)
- **Stripe React Native** (pagos)
- **Zustand** (state management)
- **TypeScript**
- **ngeohash** (búsqueda geoespacial)
- **@gorhom/bottom-sheet** (panel deslizable)

### Backend (Firebase)
- **Firebase Auth** (autenticación email + Google)
- **Cloud Firestore** (base de datos)
- **Firebase Storage** (fotos)
- **Firebase Cloud Functions** (lógica de servidor)
- **Stripe** (pagos + Connect)
- **Expo Server SDK** (push notifications desde backend)

---

## 4. Estructura Actual del Proyecto

```
parkshare/
├── App.tsx                          # Re-exporta desde src/app/App
├── app.json                         # Config Expo
├── package.json                     # Dependencias
├── tsconfig.json                    # TypeScript config
├── babel.config.js                  # Babel config
├── firestore.rules                  # Reglas Firestore
│
├── src/
│   ├── app/
│   │   └── App.tsx                  # App principal (Stripe + Navigation)
│   │
│   ├── components/
│   │   ├── LoadingOverlay.tsx        # Overlay de carga
│   │   ├── PhotoPicker.tsx           # Selector foto (cámara/galería)
│   │   ├── SpotCard.tsx              # Tarjeta de plaza en el mapa
│   │   ├── SpotMarker.tsx            # Marcador en el mapa
│   │   ├── StarRating.tsx            # Componente de estrellas
│   │   └── Timer.tsx                 # Timer de sesión activa
│   │
│   ├── config/
│   │   ├── firebase.ts               # Config Firebase (Auth, Firestore, Storage)
│   │   └── stripe.ts                 # Config Stripe (keys, comisión 15%)
│   │
│   ├── hooks/
│   │   ├── useActiveReservation.ts   # Escucha reserva activa del usuario
│   │   ├── useAuth.ts                # Estado de autenticación
│   │   ├── useLocation.ts            # Geolocalización del dispositivo
│   │   └── useNearbySpots.ts         # Plazas cercanas en tiempo real
│   │
│   ├── navigation/
│   │   ├── AuthStack.tsx             # Stack: Login → Register
│   │   ├── MainTabs.tsx              # Tabs: Mapa | Compartir | Actividad | Perfil
│   │   └── RootNavigator.tsx         # Decisión: Auth vs Main + pantallas modales
│   │
│   ├── screens/
│   │   ├── activity/
│   │   │   └── ActivityScreen.tsx    # Reserva activa + historial
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx       # Login email/password
│   │   │   └── RegisterScreen.tsx    # Registro con nombre
│   │   ├── map/
│   │   │   ├── MapScreen.tsx         # Mapa principal con plazas
│   │   │   └── SpotDetailsScreen.tsx # Detalle + botón reservar
│   │   ├── payment/
│   │   │   ├── PaymentScreen.tsx     # Pantalla de pago Stripe
│   │   │   └── PaymentSuccessScreen.tsx # Confirmación pago
│   │   ├── profile/
│   │   │   ├── EditProfileScreen.tsx # Editar nombre
│   │   │   └── ProfileScreen.tsx     # Perfil + ganancias + settings
│   │   ├── rating/
│   │   │   └── RateSpotScreen.tsx    # Valorar plaza (1-5 estrellas)
│   │   └── share/
│   │       └── ShareSpotScreen.tsx   # Publicar plaza (mapa + form)
│   │
│   ├── services/
│   │   ├── authService.ts            # signUp, signIn, signInWithGoogle, logOut
│   │   ├── notificationService.ts    # Registro push tokens
│   │   ├── paymentService.ts         # createPaymentIntent, createConnectAccount
│   │   ├── ratingService.ts          # rateSpot, getSpotRatings
│   │   ├── reservationService.ts     # reserveSpot, endReservation, historial
│   │   ├── spotService.ts            # CRUD spots + búsqueda geohash
│   │   └── storageService.ts         # Upload fotos a Firebase Storage
│   │
│   ├── stores/
│   │   └── appStore.ts               # Zustand store (profile, activeReservation)
│   │
│   ├── types/
│   │   ├── navigation.ts             # Tipos de navegación
│   │   ├── reservation.ts            # Tipo Reservation
│   │   ├── spot.ts                   # Tipo Spot, SpotRating
│   │   └── user.ts                   # Tipo UserProfile
│   │
│   └── utils/
│       ├── formatCurrency.ts         # formatCents, formatPricePerHour
│       ├── formatTime.ts             # formatDuration, formatTimer, formatDate
│       ├── geohash.ts                # encode, decode, ranges, distanceBetween
│       └── validators.ts             # isValidEmail, isValidPrice, priceToCents
│
└── functions/
    ├── package.json                   # Dependencias Cloud Functions
    ├── tsconfig.json
    └── src/
        ├── index.ts                   # Exporta todas las functions
        ├── notifications/
        │   └── sendPushNotification.ts # Trigger: notifica al owner/seeker
        ├── spots/
        │   └── cleanupExpiredSpots.ts  # Scheduled: limpia spots expirados cada 15min
        └── stripe/
            ├── createConnectAccount.ts # Crea cuenta Stripe Connect para owner
            ├── createPaymentIntent.ts  # Crea PaymentIntent al finalizar reserva
            └── webhooks.ts             # Webhook: confirma pagos, actualiza ganancias
```

---

## 5. Lo que YA Está Implementado (✅)

1. ✅ Autenticación (email + Google)
2. ✅ Mapa con plazas en tiempo real (geohash queries)
3. ✅ Publicar plazas con GPS, foto, precio, dirección
4. ✅ Reservas con transacciones atómicas (evita doble booking)
5. ✅ Timer de sesión con coste en vivo
6. ✅ Pagos Stripe con Connect (split payments owner/plataforma)
7. ✅ Webhooks para confirmar pagos y actualizar ganancias
8. ✅ Valoraciones (1-5 estrellas + comentario)
9. ✅ Notificaciones push automáticas (reserva, pago, cancelación)
10. ✅ Limpieza automática de spots expirados (cada 15 min)
11. ✅ Historial de reservas
12. ✅ Perfil con ganancias y Stripe onboarding
13. ✅ Upload de fotos a Firebase Storage
14. ✅ Navegación completa (auth + tabs + modales)
15. ✅ Sistema de suscripciones Free / Basic / Premium (Stripe)
16. ✅ Wallet con saldo y retiro de fondos
17. ✅ Comisión actualizada al 20%
18. ✅ Cuenta atrás de 5 min + confirmación de llegada
19. ✅ Cancelar reserva desde la UI
20. ✅ Documentos legales (Política de Privacidad + Términos) — GDPR
21. ✅ EAS Build configurado (APK Android generado)
22. ✅ Filtros en el mapa (precio, radio, ordenación)
23. ✅ Búsqueda de dirección con Google Places Autocomplete
24. ✅ Analytics propio sobre Firestore (src/services/analyticsService.ts)
25. ✅ Verificación GPS al publicar plaza (publisher debe estar a <150m)
26. ✅ Sistema de reportes de plazas con auto-ocultación a los 3 reportes

---

## 6. Lo que FALTA por Implementar (🔲)

### 6.1 — Notificaciones de Proximidad (PRIORIDAD MEDIA)

**Implementar:**
- Cuando se publica una nueva plaza, notificar a seekers suscritos (Basic/Premium) que estén en un radio de 500m.
- Crear Cloud Function trigger en `spots` collection que busque usuarios cercanos con push token.

### 6.2 — Login con Apple (PRIORIDAD BAJA)

**Implementar:**
- Añadir botón "Continuar con Apple" en `LoginScreen.tsx`.
- Usar `expo-apple-authentication`.
- Actualizar `authService.ts` con `signInWithApple()`.

### 6.3 — Onboarding para nuevos usuarios (PRIORIDAD MEDIA)

**Implementar:**
- Pantallas de bienvenida (3-4 slides) explicando el concepto.
- Mostrar solo la primera vez que el usuario abre la app.
- Guardar flag `onboardingCompleted` en Firestore/AsyncStorage.

### 6.4 — Stripe modo producción (PRIORIDAD ALTA — necesario para lanzar)

**Implementar:**
- Cambiar `STRIPE_PUBLISHABLE_KEY` en `src/config/stripe.ts` por la live key.
- Actualizar Cloud Functions con la live secret key.
- Activar cuenta Stripe en modo producción.

### 6.5 — Publicación en Google Play (PRIORIDAD ALTA)

**Pasos:**
1. Crear cuenta Google Play Console (25€ único)
2. `eas build --platform android --profile production`
3. Subir AAB a Play Console → Internal Testing → Closed Beta → Production

### 6.6 — Panel de administración (PRIORIDAD MEDIA)

**Implementar:**
- Web sencilla para revisar plazas reportadas (`status: 'flagged'`)
- Ver métricas de `analyticsService`
- Resolver/restaurar plazas reportadas

---

## 7. Especificación Técnica de Endpoints

### Suscripciones (nuevos endpoints Cloud Functions)

```
createSubscription(userId, plan: 'basic' | 'premium')
  → Crea suscripción en Stripe
  → Actualiza Firestore: subscriptionTier, stripeSubscriptionId
  → Retorna: { subscriptionId, clientSecret }

cancelSubscription(userId)
  → Cancela en Stripe
  → Actualiza Firestore: subscriptionTier = 'free'

handleSubscriptionWebhook (HTTP endpoint)
  → customer.subscription.updated → actualiza tier
  → customer.subscription.deleted → tier = 'free'
  → invoice.payment_failed → notificar usuario
```

### Estructura Firestore actualizada

```
users/{userId}
  + subscriptionTier: 'free' | 'basic' | 'premium'  // NUEVO
  + subscriptionExpiresAt: Timestamp | null           // NUEVO
  + stripeSubscriptionId: string | null               // NUEVO
  + monthlyReservationCount: number                   // NUEVO
  + lastReservationResetAt: Timestamp                 // NUEVO
  ... (campos existentes)

reservations/{reservationId}
  + status: 'awaiting_arrival' | 'active' | 'completed' | 'cancelled'  // MODIFICADO (nuevo estado)
  + arrivalDeadline: Timestamp                        // NUEVO
  + arrivedAt: Timestamp | null                       // NUEVO
  ... (campos existentes)
```

---

## 8. Orden de Implementación Recomendado (actualizado 2026-03-04)

1. ✅ ~~Comisión 20%~~ — hecho
2. ✅ ~~Suscripciones~~ — hecho
3. ✅ ~~Cuenta atrás 5 min~~ — hecho
4. ✅ ~~Cancelar reserva~~ — hecho
5. ✅ ~~Wallet~~ — hecho
6. ✅ ~~Legal GDPR~~ — hecho
7. ✅ ~~Filtros mapa + búsqueda~~ — hecho
8. ✅ ~~Analytics~~ — hecho
9. ✅ ~~Verificación GPS~~ — hecho
10. ✅ ~~Sistema de reportes~~ — hecho
11. **Onboarding** — mejora conversión nuevos usuarios
12. **Stripe producción** — necesario para ingresos reales
13. **Google Play** — lanzamiento Android
14. **Notificaciones proximidad** — engagement
15. **Login Apple** — necesario para App Store
16. **App Store** — lanzamiento iOS

---

## 9. Notas Técnicas Importantes

### Color principal de la app: `#4A90D9`
### Color de éxito/disponible: `#4CAF50`
### Color de advertencia/reservado: `#FF9800`
### Color de error/destrucción: `#E53935`
### Color de rating: `#FFA000`

### Firebase Config
```
projectId: 'parkshare-2b8d6'
```

### Stripe
- Comisión: 20% (ya actualizada)
- Stripe Connect tipo Express para owners
- País por defecto: ES (España)
- Moneda: EUR

### Convenciones de código
- TypeScript estricto
- camelCase para variables y funciones
- PascalCase para componentes y tipos
- Estilos con StyleSheet.create()
- Servicios como funciones async exportadas
- Hooks con prefijo `use`
- Navegación tipada con ParamList
