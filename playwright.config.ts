import { defineConfig, ReporterDescription } from '@playwright/test';
import 'dotenv/config';

// Generate timestamp in yyyy.mm.dd.hh.mm.ss format
const now = new Date();
const pad = (n: number) => String(n).padStart(2, '0');
const timestamp = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}.${pad(now.getHours())}.${pad(now.getMinutes())}.${pad(now.getSeconds())}`;

// 🚀 CROSS-PLATFORM PATH CONFIGURATION:
// - On AWS CodeBuild/CI (Linux): Uses standard relative directory `./playwright-report`
// - On Local Machine (Windows): Uses absolute path `C:/Playwright/Reports`
const baseFolder = process.env.CI ? './playwright-report' : 'C:/Playwright/Reports';
const outputFolder = `${baseFolder}/TestRun@${timestamp}`;

// Base reporters used across all environments
const reporters: ReporterDescription[] = [
  ['list'],
  [
    'html',
    {
      open: 'never',
      outputFolder: outputFolder, // Saves interactive HTML report to timestamped folder
    },
  ],
  // 🚀 JUNIT REPORTER: Generates XML output for AWS CodeBuild Report Groups
  ['junit', { outputFile: 'results.xml' }],
];

// Only add custom local progress reporter when NOT running in CI (AWS CodeBuild)
if (!process.env.CI) {
  reporters.push([
    './reporters/console-progress.reporter.ts',
    {
      outputFile: `${outputFolder}/report.txt`,
      outputFolder: outputFolder,
    },
  ]);
}

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
  reporter: reporters,

  use: {
    // All request.get('/wp-json/...') calls resolve against this base.
    baseURL: process.env.BASE_URL ?? 'https://test.sibi.win',
    extraHTTPHeaders: {
      Accept: 'application/json',
    },

    // Artifact settings for screenshots, videos, and network trace files
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'api',
      testMatch: '**/*.spec.ts', // Matches all spec files in subdirectories (e.g. tests/api/auth.spec.ts)
    },
  ],
});