// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// react-native-skia's web runtime loads CanvasKit as a .wasm binary —
// Metro needs to treat it as an asset (not source) to bundle/serve it.
config.resolver.assetExts.push('wasm');

module.exports = config;
