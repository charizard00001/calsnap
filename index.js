import { Platform } from 'react-native';

// react-native-skia's web module caches `global.CanvasKit` into a
// module-level `Skia` object the FIRST time it's imported (Skia.web.js:
// `export const Skia = JsiSkApi(global.CanvasKit)`, evaluated once at import
// time, not lazily). Since ES imports are static/hoisted, any app code that
// statically imports `@shopify/react-native-skia` (e.g. ParticleBackground)
// would import — and freeze — that Skia object before an async
// `LoadSkiaWeb()` call anywhere in app code could finish. So CanvasKit has
// to be loaded here, in the true bundle entry point, before the rest of the
// app (which is `require()`'d, not `import`'d, so it stays lazy) is ever
// pulled in.
async function main() {
  if (Platform.OS === 'web') {
    try {
      // require(), not dynamic import() — Metro's dev server splits
      // import() into a separately-fetched async chunk here, which this
      // project's bundler config doesn't serve, so it fails with
      // "Requiring unknown module". require() stays in the single
      // synchronous bundle graph, same as the expo-router/entry require below.
      const { LoadSkiaWeb } = require('@shopify/react-native-skia/lib/module/web/LoadSkiaWeb');
      // canvaskit's default locateFile resolves the .wasm relative to the
      // JS bundle's own URL. That's the site root in dev (Metro serves
      // index.bundle from /), but production serves the bundle from
      // /_expo/static/js/web/, which sent the wasm request there too (404).
      // canvaskit.wasm lives in public/, so it's always served from root —
      // force that regardless of where the bundle itself was loaded from.
      await LoadSkiaWeb({ locateFile: (file) => `/${file}` });
    } catch (e) {
      console.warn('Skia web load failed, particle background disabled', e);
    }
  }
  require('expo-router/entry');
}

main();
