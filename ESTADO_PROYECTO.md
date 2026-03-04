# ParkShare — Estado del Proyecto
> Documento de contexto para retomar la sesión de desarrollo con Claude Code.
> Última actualización: 2026-03-01

---

## 1. Resumen del proyecto

**ParkShare** es una app móvil (React Native + Expo) para el mercado español que permite a usuarios compartir su plaza de aparcamiento privada y ganar dinero. Modelo de negocio: comisión del 20% sobre cada reserva + suscripciones premium.

- **Repositorio GitHub:** `https://github.com/vtarazona/parkshare`
- **EAS Project:** `@vtarazona/parkshare` (ID: `61988bd3-2bf1-4c94-8537-ab2a89b027c3`)
- **Firebase:** proyecto `parkshare-2b8d6`
- **Stack:** Expo SDK 54 · React Native 0.81.5 · TypeScript · Firebase JS SDK v10 · Stripe · Cloud Functions v2

---

## 2. Arquitectura técnica

### Stack
| Capa | Tecnología |
|------|-----------|
| Frontend | React Native + Expo (managed workflow) |
| Backend | Firebase (Auth, Firestore, Storage, Cloud Functions v2) |
| Pagos | Stripe Connect (split 80/20) + Subscripciones |
| Mapas | react-native-maps con PROVIDER_GOOGLE |
| Notificaciones | expo-notifications (push) |
| Build | EAS Build (cloud) |
| Deploy funciones | Firebase CLI (`firebase deploy --only functions`) |

### Archivos clave
```
parkshare/
├── app.config.js          — Config Expo + EAS projectId + Google Maps key
├── eas.json               — Perfiles de build (development/preview/production)
├── .env                   — EXPO_PUBLIC_GOOGLE_MAPS_KEY (solo desarrollo local)
├── src/
│   ├── core/App.tsx       — Root: GestureHandler > SafeArea > Stripe > Nav
│   ├── config/
│   │   ├── firebase.ts    — Config Firebase JS SDK (hardcoded, sin google-services.json)
│   │   └── stripe.ts      — STRIPE_PUBLISHABLE_KEY + CLOUD_FUNCTIONS_URL
│   ├── navigation/
│   │   ├── RootNavigator.tsx   — Auth gate + rutas raíz
│   │   ├── AuthStack.tsx       — Login / Register / Terms / PrivacyPolicy
│   │   └── MainTabs.tsx        — Tabs: Mapa / Compartir / Actividad / Perfil
│   ├── screens/
│   │   ├── auth/          LoginScreen, RegisterScreen
│   │   ├── map/           MapScreen, SpotDetailsScreen
│   │   ├── share/         ShareSpotScreen
│   │   ├── payment/       PaymentScreen, PaymentSuccessScreen
│   │   ├── profile/       ProfileScreen, EditProfileScreen
│   │   ├── wallet/        WalletScreen
│   │   ├── subscription/  SubscriptionScreen
│   │   ├── activity/      ActivityScreen
│   │   ├── rating/        RateSpotScreen
│   │   └── legal/         PrivacyPolicyScreen, TermsScreen
│   ├── services/          authService, paymentService, spotService,
│   │                      reservationService, ratingService,
│   │                      notificationService, storageService, subscriptionService
│   ├── hooks/             useAuth, useLocation, useNearbySpots, useActiveReservation
│   ├── types/             navigation.ts, spot.ts, user.ts, reservation.ts
│   └── utils/             formatCurrency, formatTime, geohash, validators
└── functions/src/
    ├── stripe/            createConnectAccount, createPaymentIntent,
    │                      subscriptions, webhooks
    ├── spots/             cleanupExpiredSpots
    ├── notifications/     sendPushNotification
    └── utils/             rateLimiter
```

---

## 3. Credenciales y claves (entorno)

| Variable | Dónde está | Valor |
|----------|-----------|-------|
| `EXPO_PUBLIC_GOOGLE_MAPS_KEY` | `.env` local + **pendiente EAS secret** | `AIzaSyDqeGcEHRKDRBpEQMKx4L6ONNtoNUeHzOM` |
| `STRIPE_PUBLISHABLE_KEY` | `src/config/stripe.ts` hardcoded | `pk_test_51T5i3B...` (test mode) |
| `CLOUD_FUNCTIONS_URL` | `src/config/stripe.ts` hardcoded | `https://us-central1-parkshare-2b8d6.cloudfunctions.net` |
| Firebase config | `src/config/firebase.ts` hardcoded | apiKey: `AIzaSyD0cL8TMp3wgZS2MrJtlmrEYfW80VRFpWw` |

---

## 4. Estado actual — Fases completadas

### ✅ Fase 1 — MVP funcional
- Autenticación Firebase (login / registro)
- Mapa con plazas cercanas (Geohash + Firestore)
- Publicar plaza propia (fotos, precio, horario)
- Reservar plaza con Stripe (PaymentIntent)
- Sistema de valoraciones (1-5 estrellas)
- Notificaciones push (expo-notifications)
- Perfil + Wallet (ganancias, Stripe Connect onboarding)
- Suscripciones (Free / Basic / Premium) con Stripe
- Cloud Functions v2 desplegadas en Firebase

### ✅ Assets / Logo
- `assets/logo.png` — logo original (1024×1024)
- `assets/icon.png` — fondo azul #4A90D9 (1024×1024)
- `assets/adaptive-icon.png` — Android adaptive icon
- `assets/splash.png` — pantalla de carga (1284×2778)
- Logo integrado en: LoginScreen, RegisterScreen, MapScreen header, RootNavigator loading

### ✅ Fase 2 — Legal / GDPR
- `PrivacyPolicyScreen.tsx` — 10 secciones, contacto: privacidad@parkshare.es
- `TermsScreen.tsx` — 12 secciones, contacto: legal@parkshare.es
- RegisterScreen: checkbox de aceptación obligatorio + links a documentos legales
- ProfileScreen: sección "Legal" con acceso a ambos documentos
- AuthStack y RootNavigator: rutas añadidas para Terms y PrivacyPolicy
- Salir de app: `BackHandler.exitApp()` en Android, instrucción en iOS

### ✅ EAS Build configurado
- `eas.json` creado con perfiles development / preview / production
- `app.config.js` actualizado con EAS projectId y owner
- Build de prueba completado: APK generado y descargado

---

## 5. Problema activo (PENDIENTE DE RESOLVER)

### 🔴 App crashea al abrir en dispositivo físico Android

**Causa:** `EXPO_PUBLIC_GOOGLE_MAPS_KEY` no fue subida como secreto EAS antes del build. La clave queda `undefined` en el APK, el SDK nativo de Google Maps no puede inicializarse y la app cierra al arrancar.

**Solución — ejecutar en orden:**
```bash
# Paso 1: subir el secreto a EAS
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_KEY --value "AIzaSyDqeGcEHRKDRBpEQMKx4L6ONNtoNUeHzOM"

# Paso 2: recompilar
eas build --platform android --profile preview
```
Luego desinstalar el APK anterior e instalar el nuevo.

---

## 6. Próximas fases (roadmap)

### ✅ Fase 3 — UX / Producto (completada 2026-03-04)
- ✅ Filtros en el mapa: precio máximo, radio de búsqueda (0.5/1/2/5 km), ordenar por distancia/precio/rating
  - `src/components/MapFilters.tsx` — panel modal con chips seleccionables
- ✅ Búsqueda de dirección con Google Places Autocomplete
  - `src/components/PlaceSearch.tsx` — barra de búsqueda con debounce + lista de predicciones
- ✅ Pantallas de estado vacío mejoradas
  - MapScreen: mensaje cuando no hay plazas / no hay plazas con filtros / sin permiso GPS
  - ShareSpotScreen: estado visual con icono cuando no hay permiso de ubicación
- ⬜ Flujo de onboarding para nuevos usuarios
- ⬜ Mejoras de rendimiento y animaciones

### Fase 4 — Lanzamiento
- Stripe modo producción (activar live keys)
- Subir a Google Play (Internal Testing → Closed Beta → Production)
- Subir a App Store (TestFlight → Review → Production)
- Landing page pública
- ✅ Analytics — servicio propio sobre Firestore (`src/services/analyticsService.ts`)
  - Eventos: sign_up, login, spot_published, reservation_created, payment_completed, map_filter_applied
  - Datos en colección `analytics_events` en Firestore
- Panel de administración

---

## 7. Últimos commits en GitHub
```
ea63b1c Añadir documento de estado del proyecto para continuidad de sesiones
9088dc0 EAS Build: configuración proyecto y perfil de compilación
d59e574 Fase 2: Documentos legales + cumplimiento GDPR
3a4218d Semana 2: Cloud Functions v2 + logo integrado en toda la app
8526db2 Fix notificaciones push y limpieza de variables no usadas
```

---

## 8. Comandos útiles

```bash
# Desarrollo local
cd C:/Users/victa/claude/parkshare
npx expo start

# Build Android APK (beta)
eas build --platform android --profile preview

# Build iOS (requiere Mac/cuenta developer)
eas build --platform ios --profile preview

# Deploy Cloud Functions
cd functions && npm run deploy

# Ver secretos EAS
eas secret:list

# Git
git status
git push origin main
```

---

## 9. Notas importantes

- Firebase usa el **JS SDK** (no google-services.json) — la config está hardcoded en `src/config/firebase.ts`
- El proyecto usa **Expo managed workflow** — no hay carpetas `ios/` ni `android/` en el repo
- Stripe está en **modo test** — todas las transacciones son simuladas
- El proyecto es para el **mercado español** — textos en castellano, RGPD aplicable
- Directorio del proyecto en local: `C:\Users\victa\claude\parkshare`
