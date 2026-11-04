import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: [
    '**/json-formatter.spec.ts',
    '**/base64.spec.ts',
    '**/color-converter.spec.ts',
    '**/date-calculator.spec.ts',
    '**/time-zone-converter.spec.ts',
    '**/hash-generator.spec.ts',
    '**/locale-messages.spec.ts',
    '**/random-string-generator.spec.ts',
    '**/qr-code.spec.ts',
    '**/markdown-preview.spec.ts',
    '**/url-encoder.spec.ts',
    '**/unix-timestamp-converter.spec.ts',
    '**/smoke.spec.ts',
    '**/tool-search.spec.ts',
  ],
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 3000',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
