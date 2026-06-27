import { defineConfig } from 'vitest/config'
import { config } from 'dotenv'

config({ path: '.env.test', override: true })

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['src/__tests__/setup.ts'],
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? '',
    },
    fileParallelism: false, // prevents DB race between test files sharing devflow_test
  },
})
