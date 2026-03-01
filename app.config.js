module.exports = {
  expo: {
    name: 'ParkShare',
    slug: 'parkshare',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#4A90D9',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.parkshare.app',
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY,
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'ParkShare necesita tu ubicación para mostrar plazas de parking cercanas.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'ParkShare necesita tu ubicación para compartir tu plaza de parking.',
        NSCameraUsageDescription:
          'ParkShare necesita acceso a la cámara para tomar fotos de tu plaza.',
        NSPhotoLibraryUsageDescription:
          'ParkShare necesita acceso a tus fotos para subir imágenes de tu plaza.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#4A90D9',
      },
      package: 'com.parkshare.app',
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY,
        },
      },
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'CAMERA',
      ],
    },
    extra: {
      eas: {
        projectId: '61988bd3-2bf1-4c94-8537-ab2a89b027c3',
      },
    },
    owner: 'vtarazona',
    plugins: [
      [
        '@stripe/stripe-react-native',
        {
          merchantIdentifier: 'merchant.com.parkshare.app',
          enableGooglePay: true,
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'ParkShare necesita tu ubicación para mostrar plazas cercanas.',
        },
      ],
      [
        'expo-image-picker',
        {
          cameraPermission:
            'ParkShare necesita acceso a la cámara para fotos de plazas.',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#4A90D9',
        },
      ],
    ],
  },
};
