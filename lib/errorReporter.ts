import { Platform } from 'react-native';

// Single client-side choke point for error reporting. Right now it emits a
// structured console line (tagged so it's greppable in browser logs and any
// future log drain); when an analytics/error sink is added — PostHog,
// Sentry, whatever — this is the only place that has to change.

type ErrorContext = Record<string, unknown>;

let installed = false;

function normalize(err: unknown): { name: string; message: string; stack?: string } {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  return { name: 'NonError', message: typeof err === 'string' ? err : JSON.stringify(err) };
}

export function reportError(err: unknown, context?: ErrorContext): void {
  const { name, message, stack } = normalize(err);

  console.error(
    JSON.stringify({
      marker: 'calsnap.client_error',
      name,
      message,
      stack,
      platform: Platform.OS,
      ...context,
      at: new Date().toISOString(),
    })
  );
}

// Catches errors that never reach a React error boundary — async throws,
// rejected promises, event-handler errors. Web-only; native already routes
// these through its own global handler and the boundary covers renders.
export function installGlobalErrorHandlers(): void {
  if (installed || Platform.OS !== 'web' || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener('error', (event) => {
    reportError(event.error ?? event.message, { source: 'window.onerror' });
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason, { source: 'unhandledrejection' });
  });
}
