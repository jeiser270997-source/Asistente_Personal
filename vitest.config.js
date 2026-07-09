import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.js'],
    testTimeout: 15_000,
    setupFiles: ['tests/helpers/setup.js'],
    server: {
      deps: {
        // better-sqlite3 is a native addon — vitest handles it fine, no transform needed
        inline: ['better-sqlite3'],
      },
    },
  },
});
