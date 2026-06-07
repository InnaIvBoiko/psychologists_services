import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end test configuration.
 *
 * These tests drive the real Next.js app (App Router + Auth.js + Prisma/Neon)
 * through a browser, complementing the component-level Vitest suite.
 *
 * The dev server is started automatically (see `webServer`); locally an already
 * running server on :3000 is reused so the suite starts instantly.
 */
const PORT = process.env.PORT || 3000
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  // Sweep any throwaway accounts an auth test failed to clean up itself.
  globalTeardown: './e2e/global-teardown.js',
  // Each spec is isolated; run files in parallel for speed.
  fullyParallel: true,
  // Fail the CI build if a `test.only` is committed by accident.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL,
    // Capture a trace/screenshot only when something fails — keeps runs cheap.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'en-US',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Add Firefox/WebKit here when cross-browser coverage is needed:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',  use: { ...devices['Desktop Safari'] } },
  ],

  // Boot the app for the test run. Locally this is `next dev` (and a hand-started
  // server is reused); CI sets PLAYWRIGHT_WEB_SERVER='npm run start' to test the
  // production build, which avoids slow first-request compilation.
  webServer: {
    command: process.env.PLAYWRIGHT_WEB_SERVER || 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
