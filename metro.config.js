const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable package exports resolution to force Metro to use
// resolverMainFields: ['react-native', 'browser', 'main']
// This ensures @firebase/auth RN build and our code use the same @firebase/app instance
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
