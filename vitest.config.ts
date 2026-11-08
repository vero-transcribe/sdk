import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 120000, // 2 minutes for E2E tests
    hookTimeout: 60000,
    include: ['tests/**/*.test.ts'],
    // E2E tests should run sequentially to avoid rate limiting
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
  },
})
