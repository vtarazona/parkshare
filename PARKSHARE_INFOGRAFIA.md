# ParkShare — Documento de Funcionamiento para Infografía

## ¿Qué es ParkShare?

ParkShare es una aplicación móvil de economía colaborativa para aparcamiento urbano. Conecta a **conductores** que necesitan aparcar con **propietarios** de plazas privadas que no las están usando. El propietario publica su plaza, el conductor la reserva y paga por horas. ParkShare cobra una comisión del 20% y transfiere el 80% restante al propietario automáticamente.

---

## Actores del Sistema

| Actor | Rol | Motivación |
|-------|-----|-----------|
| **Conductor** | Busca y reserva plazas cercanas | Encontrar aparcamiento fácil y barato |
| **Propietario** | Publica y gestiona sus plazas | Ganar dinero con una plaza que no usa |
| **Plataforma** | Gestiona pagos, seguridad y comisiones | Comisión del 20% por transacción |

---

## Estructura de la Aplicación

La app tiene 4 pestañas principales:

### 1. MAPA (Pestaña principal)
- Muestra el mapa de Google Maps centrado en la ubicación del usuario
- Presenta marcadores azules con el precio por hora de cada plaza disponible
- Al tocar un marcador aparece una tarjeta con: dirección, precio, distancia y valoración
- Botón "Ver detalles" para ver la ficha completa y reservar

### 2. COMPARTIR (Para propietarios)
- Formulario para publicar una plaza de aparcamiento
- Mapa interactivo para colocar el pin exacto de la plaza
- Geocoding automático que detecta la dirección al mover el pin
- Campos: precio por hora, descripción, foto de la plaza

### 3. ACTIVIDAD (Historial)
- Muestra la reserva activa en tiempo real con temporizador
- Botones de acción según el estado: "He llegado", "Salir"
- Historial de reservas pasadas con duración y precio pagado

### 4. PERFIL
- Tarjeta de ganancias totales (acceso al Wallet)
- Configuración de cobros con Stripe Connect
- Gestión del plan de suscripción
- Editar perfil y cerrar sesión

---

## Flujo 1: Registro e Inicio de Sesión

```
USUARIO NUEVO                    USUARIO EXISTENTE
     │                                  │
     ▼                                  ▼
Pantalla Registro              Pantalla Login
- Nombre                       - Email
- Email                        - Contraseña
- Contraseña                          │
     │                         Firebase Auth
     ▼                                │
Firebase Auth                         ▼
crea cuenta                    Verificar credenciales
     │                                │
     ▼                                ▼
Crea documento usuario         Cargar perfil Firestore
en Firestore con:                     │
- subscriptionTier: free              ▼
- totalEarnings: 0             APLICACIÓN PRINCIPAL
- averageRating: 0                (4 pestañas)
     │
     ▼
APLICACIÓN PRINCIPAL
```

**Datos almacenados al registrarse:**
- UID único de Firebase Auth
- Email y nombre de usuario
- Plan de suscripción: Free (por defecto)
- Contador de reservas mensuales: 0
- Ganancias totales: 0€
- Token de notificaciones push (Expo)

---

## Flujo 2: Buscar y Reservar una Plaza

```
PASO 1 — DESCUBRIR
Usuario abre pestaña Mapa
       │
       ▼
GPS obtiene coordenadas actuales
       │
       ▼
Firestore consulta plazas cercanas
(algoritmo geohash, radio ~2 km)
       │
       ▼
Aparecen marcadores azules con precio

PASO 2 — SELECCIONAR
Toca un marcador
       │
       ▼
SpotCard: dirección, precio/hora, distancia, ⭐ valoración
       │
       ▼
"Ver detalles" → SpotDetailsScreen
Foto de la plaza, descripción completa, nombre del propietario

PASO 3 — RESERVAR
Botón "Reservar Plaza"
       │
       ▼
¿Tiene suscripción Basic o Premium?
    No → Pantalla de suscripción (debe contratar plan)
    Sí → Continúa
       │
       ▼
Transacción Firestore atómica:
- spot.status: available → reserved
- Se crea documento Reservation en Firestore
- arrivalDeadline: ahora + 5 minutos

PASO 4 — LLEGADA (5 minutos)
Countdown visible en pantalla de Actividad
       │
       ├── Llega a tiempo → "He llegado"
       │         │
       │         ▼
       │   Reservation.status: active
       │   Timer de duración empieza
       │
       └── No llega → Reserva cancelada automáticamente
                    spot.status → available

PASO 5 — APARCAMIENTO ACTIVO
Timer en tiempo real (horas:minutos:segundos)
       │
       ▼
Usuario pulsa "Salir"
       │
       ▼
Cálculo automático:
- Duración en minutos
- Precio total = (minutos/60) × precio_hora (mínimo 1 hora)
- Comisión plataforma = 20% del total
- Pago propietario = 80% del total

PASO 6 — PAGO
PaymentScreen con Stripe
       │
       ▼
Stripe PaymentIntent creado (Cloud Function)
       │
       ▼
Usuario confirma pago con tarjeta
       │
       ▼
Stripe transfiere 80% a cuenta propietario (Connect)
       │
       ▼
Pantalla de éxito → Valorar la plaza ⭐
```

---

## Flujo 3: Publicar una Plaza (Propietario)

```
PASO 1 — UBICACIÓN
Pestaña "Compartir"
GPS centra el mapa en tu ubicación
Usuario arrastra el pin a su plaza exacta
       │
       ▼
Geocoding automático detecta la dirección
(Google Maps Geocoding API)

PASO 2 — CONFIGURAR
- Precio por hora (ej: 1,50€)
- Descripción (ej: "Plaza cubierta, fácil acceso")
- Foto de la plaza (cámara o galería)

PASO 3 — PUBLICAR
Botón "Compartir Plaza"
       │
       ▼
Firestore: nuevo documento en colección "spots"
- ownerId: tu UID
- location: coordenadas GPS
- geohash: hash para búsquedas rápidas
- pricePerHourCents: precio en céntimos
- status: available
- photoURL: enlace a Firebase Storage

RESULTADO:
Tu plaza aparece en el mapa para todos los usuarios
```

---

## Flujo 4: Recibir Pagos (Propietario)

```
Conductor completa reserva y paga
       │
       ▼
Stripe procesa el pago
       │
       ├── 20% → Plataforma ParkShare
       └── 80% → Cuenta Stripe Connect del propietario
                        │
                        ▼
              Firestore actualiza:
              usuario.totalEarnings += ownerPayoutCents

WALLET DEL PROPIETARIO:
- Ganancias totales acumuladas
- Ganancias del mes actual
- Número de reservas completadas
- Valoración media de sus plazas
- Historial de transacciones individuales
```

---

## Flujo 5: Sistema de Suscripciones

```
PLANES DISPONIBLES:

FREE (0€/mes)
├── Ver el mapa con plazas
├── Publicar plazas ilimitadas
├── NO puede reservar
└── Con anuncios

BASIC (4,99€/mes)
├── Todo lo de Free
├── Reservar hasta 10 plazas al mes
└── Con anuncios

PREMIUM (9,99€/mes)
├── Todo lo de Basic
├── Reservas ilimitadas
├── Sin anuncios
└── Soporte prioritario

PROCESO DE SUSCRIPCIÓN:
Usuario selecciona plan
       │
       ▼
Cloud Function crea sesión Stripe Checkout
       │
       ▼
Usuario completa pago en Stripe (web)
       │
       ▼
Webhook de Stripe notifica a Firebase
       │
       ▼
Firestore actualiza subscriptionTier del usuario
       │
       ▼
Usuario tiene acceso inmediato al nuevo plan
```

---

## Arquitectura Técnica

### Stack Tecnológico

| Capa | Tecnología | Función |
|------|-----------|---------|
| **Frontend** | React Native + Expo SDK 54 | App iOS y Android |
| **Mapas** | Google Maps (react-native-maps) | Visualización de plazas |
| **Autenticación** | Firebase Auth | Login / Registro |
| **Base de datos** | Cloud Firestore | Spots, Reservations, Users |
| **Almacenamiento** | Firebase Storage | Fotos de plazas |
| **Backend** | Firebase Cloud Functions (Node.js 18) | Pagos, webhooks |
| **Pagos** | Stripe + Stripe Connect | Cobros y transferencias |
| **Notificaciones** | Expo Push Notifications | Avisos en tiempo real |
| **Geolocalización** | expo-location + ngeohash | GPS y búsquedas geoespaciales |

### Colecciones en Firestore

**users**
- uid, email, displayName
- subscriptionTier (free/basic/premium)
- totalEarnings, averageRating
- stripeCustomerId, stripeConnectAccountId

**spots**
- ownerId, location, geohash
- pricePerHourCents, status
- description, photoURL, address

**reservations**
- spotId, spotOwnerId, reservedByUserId
- status (awaiting_arrival / active / completed / cancelled)
- arrivalDeadline, durationMinutes
- totalChargeCents, ownerPayoutCents, platformFeeCents

---

## Estados de una Reserva

```
AVAILABLE (plaza disponible)
     │
     ▼ [usuario reserva]
RESERVED (spot reservado, esperando llegada)
     │
     ├─── [5 minutos expiran] ──► CANCELLED
     │
     ▼ [usuario confirma llegada]
ACTIVE (aparcado, timer corriendo)
     │
     ▼ [usuario pulsa "Salir"]
COMPLETED (reserva completada, pago procesado)
```

---

## Seguridad y Protección de Datos

- **Claves de API**: almacenadas en variables de entorno, nunca en el código fuente
- **Reglas Firestore**: cada usuario solo puede leer/escribir sus propios datos
- **Pagos**: procesados exclusivamente por Stripe (PCI compliant)
- **Autenticación**: Firebase Auth con tokens JWT seguros
- **Comisión**: calculada en servidor (Cloud Function), no en el cliente

---

## Modelo de Negocio

| Fuente de ingresos | Detalle |
|-------------------|---------|
| Comisión por reserva | 20% de cada pago procesado |
| Suscripción Basic | 4,99€/mes × usuarios Basic |
| Suscripción Premium | 9,99€/mes × usuarios Premium |

**Ejemplo de transacción:**
- Plaza a 2€/hora, 3 horas aparcado
- Total cobrado al conductor: 6,00€
- ParkShare recibe: 1,20€ (20%)
- Propietario recibe: 4,80€ (80%)

---

## Notificaciones Push

El sistema envía notificaciones automáticas en estos eventos:

| Evento | Destinatario | Mensaje |
|--------|-------------|---------|
| Nueva reserva | Propietario | "Alguien ha reservado tu plaza" |
| Conductor llega | Propietario | "El conductor ha llegado" |
| Reserva cancelada | Propietario | "La reserva ha sido cancelada" |
| Pago completado | Propietario | "Has recibido X€ por tu plaza" |
| Countdown expira | Conductor | "Tu tiempo de llegada ha expirado" |

---

*Documento generado para ParkShare v1.0.0 — Febrero 2026*
