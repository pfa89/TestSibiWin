import { defineConfig } from '@playwright/test';
import 'dotenv/config';

/**
 * Playwright configuration for API testing the WordPress site at test.sibi.win.
 * Docs: https://playwright.dev/docs/test-api-testing
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // The site runs on shared hosting, so hammering it with many parallel
  // requests on a cold cache can cause occasional timeouts. One retry absorbs
  // that transient flakiness without hiding real, repeatable failures.
  retries: process.env.CI ? 2 : 1,
  // Cap parallel workers so we don't overload the shared host.
  workers: process.env.CI ? 1 : 4,
  // Give each test a generous 60s (the default is 30s) for slow cold responses.
  timeout: 60_000,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    // All request.get('/wp-json/...') calls resolve against this base.
    baseURL: process.env.BASE_URL ?? 'https://test.sibi.win',
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
    // Capture request/response traces on the first retry for debugging.
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'api',
      testMatch: /.*\.spec\.ts/,
    },
  ],
});
