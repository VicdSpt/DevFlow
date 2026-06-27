import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['src/__tests__/setup.ts'],
    env: {
      DATABASE_URL: 'postgresql://postgres:mysqlpassword@localhost:5432/devflow_test',
    },
  },
})
