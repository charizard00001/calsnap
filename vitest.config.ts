import { defineConfig } from 'vitest/config';

// Unit tests cover the pure logic only (nutrition parsing, date helpers,
// daily-log mapping). They deliberately don't touch the React Native /
// Expo module graph, so a plain node environment is all that's needed.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': __dirname,
    },
  },
});
