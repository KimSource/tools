import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/pwa-update.spec.ts',
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3002',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'node scripts/update-test-server.mjs',
    url: 'http://127.0.0.1:3002/tools/',
    reuseExistingServer: false,
    timeout: 120000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
