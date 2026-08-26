/**
 * Single choke point for server-side error logging. Emits one structured
 * JSON line tagged with a stable marker so a log drain (or a future
 * Sentry / PostHog sink) can pick these out without touching call sites.
 *
 * Returns the plain message string for convenience when building a response.
 */
export function reportServerError(
  scope: string,
  err: unknown,
  context?: Record<string, unknown>
): string {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;

  console.error(
    JSON.stringify({
      marker: 'calsnap.server_error',
      scope,
      message,
      stack,
      ...context,
      at: new Date().toISOString(),
    })
  );

  return message;
}
