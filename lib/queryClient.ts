import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Long enough that moving between tabs doesn't refire the same three
      // round trips, short enough that data doesn't feel frozen.
      staleTime: 30_000,
      // Keep days you've already looked at in memory, so going back to
      // History paints from cache while it revalidates behind you.
      gcTime: 30 * 60_000,
      // Coming back to the tab is exactly when you want fresh numbers —
      // without this the only way to pick up a change made elsewhere was to
      // reopen the app.
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});
