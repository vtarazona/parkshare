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

---

## 6. Lo que FALTA por Implementar (🔲)

### 6.1 — Sistema de Suscripciones (PRIORIDAD ALTA)

**Actualmente:** Cualquier usuario puede hacer todo. No hay restricciones por tier.

**Implementar:**

#### 6.1.1 Actualizar tipo UserProfile
Añadir campo `subscriptionTier: 'free' | 'basic' | 'premium'` y `subscriptionExpiresAt: Timestamp | null` y `monthlyReservationCount: number` al tipo `UserProfile` en `src/types/user.ts`.

#### 6.1.2 Crear servicio de suscripciones
Crear `src/services/subscriptionService.ts`:
- `getSubscriptionStatus(userId)` — Devuelve el tier actual y si está activo
- `subscribeToPlan(userId, plan)` — Crea suscripción en Stripe
- `cancelSubscription(userId)` — Cancela suscripción
- `checkReservationLimit(userId)` — Verifica si el usuario Basic ha llegado al límite de 10/mes

#### 6.1.3 Crear pantalla de suscripción
Crear `src/screens/subscription/SubscriptionScreen.tsx`:
- Muestra los 3 planes con precios y características
- Botón de suscribirse que conecta con Stripe
- Indicador del plan actual
- Opción de cancelar/cambiar plan

#### 6.1.4 Crear Cloud Function para suscripciones Stripe
Crear `functions/src/stripe/subscriptions.ts`:
- Crear productos y precios en Stripe (Basic: 4.99€/mes, Premium: 9.99€/mes)
- Manejar webhooks de suscripción (renovación, cancelación, fallo de pago)
- Actualizar el tier del usuario en Firestore automáticamente

#### 6.1.5 Aplicar restricciones en el frontend
- En `MapScreen.tsx`: Si el usuario es Free, mostrar las plazas pero al pulsar "Reservar" mostrar un modal que invita a suscribirse.
- En `SpotDetailsScreen.tsx`: Bloquear botón "Reservar" para usuarios Free. Mostrar "Suscríbete para reservar".
- En `reservationService.ts`: Verificar tier y límite mensual antes de crear reserva.
- En `ShareSpotScreen.tsx`: Permitir a todos los tiers publicar plazas (no hay restricción).

#### 6.1.6 Añadir navegación
Añadir `SubscriptionScreen` al `RootNavigator.tsx` y un acceso desde `ProfileScreen.tsx`.

### 6.2 — Actualizar Comisión de 15% a 20% (PRIORIDAD ALTA)

**Archivos a modificar:**
- `src/config/stripe.ts` — Cambiar `PLATFORM_FEE_PERCENTAGE` de `0.15` a `0.20`
- `functions/src/stripe/createPaymentIntent.ts` — Cambiar `PLATFORM_FEE_RATE` de `0.15` a `0.20`
- `src/services/reservationService.ts` — Cambiar el cálculo de `platformFeeCents` de `0.15` a `0.20`
- `src/screens/payment/PaymentScreen.tsx` — Cambiar el texto "15% de comisión" a "20% de comisión"

### 6.3 — Cuenta Atrás de 5 Minutos para Llegar (PRIORIDAD ALTA)

**Actualmente:** El seeker reserva y el timer empieza a contar el tiempo de uso. No hay límite para llegar.

**Implementar:**
- Cuando el seeker reserva, empieza una cuenta atrás de 5 minutos (300 segundos).
- Si no confirma llegada en 5 min, la reserva se cancela automáticamente y la plaza vuelve a estar disponible.
- Crear `src/components/ArrivalCountdown.tsx` — Componente visual con cuenta atrás.
- Añadir botón "He llegado" en `ActivityScreen.tsx` que confirma la llegada.
- Modificar `reservationService.ts` para añadir estado `awaiting_arrival` antes de `active`.
- Crear Cloud Function o usar Redis TTL para expirar reservas no confirmadas.
- Flujo: `reservada (awaiting_arrival)` → confirma llegada → `activa` → finaliza → `completada`

### 6.4 — Notificaciones de Proximidad (PRIORIDAD MEDIA)

**Implementar:**
- Cuando se publica una nueva plaza, notificar a seekers suscritos (Basic/Premium) que estén en un radio de 500m.
- Crear Cloud Function trigger en `spots` collection que busque usuarios cercanos con push token.
- Respetar preferencias de notificación del usuario.

### 6.5 — Wallet y Retiro de Fondos (PRIORIDAD MEDIA)

**Actualmente:** Se muestran ganancias pero no hay forma de retirar dinero.

**Implementar:**
- Crear `src/screens/wallet/WalletScreen.tsx` con saldo detallado y botón "Retirar".
- Crear Cloud Function `functions/src/stripe/payouts.ts` para transferir fondos via Stripe Connect.
- Historial de retiros.

### 6.6 — Login con Apple (PRIORIDAD BAJA)

**Implementar:**
- Añadir botón "Continuar con Apple" en `LoginScreen.tsx`.
- Usar `expo-apple-authentication`.
- Actualizar `authService.ts` con `signInWithApple()`.

### 6.7 — Cancelar Reserva desde la App (PRIORIDAD BAJA)

**Actualmente:** La lógica existe en el backend (`cancelled` status) pero no hay botón en la UI.

**Implementar:**
- Añadir botón "Cancelar reserva" en `ActivityScreen.tsx` cuando hay reserva activa.
- Crear función `cancelReservation(reservationId)` en `reservationService.ts`.
- Liberar la plaza al cancelar.

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

## 8. Orden de Implementación Recomendado

1. **Actualizar comisión** de 15% a 20% (5 min, cambiar 4 archivos)
2. **Sistema de suscripciones** — tipos, servicio, Cloud Functions, UI, restricciones
3. **Cuenta atrás de 5 min** — nuevo flujo de reserva
4. **Cancelar reserva** desde la UI
5. **Notificaciones de proximidad**
6. **Wallet y retiros**
7. **Login con Apple**

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
- Comisión actual: 15% (CAMBIAR A 20%)
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
