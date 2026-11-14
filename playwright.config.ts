import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests for the things jsdom cannot run.
 *
 * The unit suite covers state machines and prop plumbing, but every animation
 * and gesture path — View Transitions, the Web Animations API, real pointer
 * events with velocity — is invisible to it. jsdom has no compositor, so a
 * regression in a morph or a pinch ships silently.
 *
 * Deliberately pointed at the production build rather than `vite dev`. The dev
 * server serves the library as unbundled modules with development-only checks
 * (the `[ramka]` warnings, `DEV` branches), and lazy chunks load on first use
 * instead of from the warmed build, so it is not what consumers get. The
 * production build is.
 *
 * That choice costs access to the `/debug/*` pages, which answer 404 outside
 * development and include a self-verifying audit panel. Worth revisiting as a
 * separate development-mode project if those checks earn their keep; the
 * attribute assertions here do not need them.
 */

// Not 5173 or 4173: `vite dev` and `vite preview` default there, and a suite
// that fights the developer's own server for a port either reuses it by
// accident (possibly a stale build) or kills it.
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 4180);

/** Specs written for a phone viewport and touch input. */
const MOBILE = '**/mobile/**';
/** Desktop projects run everything else. */
const DESKTOP_IGNORES = [MOBILE];

export default defineConfig({
  testDir: './e2e',
  // Animations are the thing under test, so a stray `.only` left in a spec
  // would quietly stop covering them.
  forbidOnly: !!process.env.CI,
  // A flaky animation test is worse than none: it trains everyone to re-run
  // until green. Failures here should be reproducible, so no retries.
  retries: 0,
  // Morphs are timing-sensitive, and parallel workers on a shared CI core
  // stretch frame budgets enough to change what a test sees.
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  timeout: 30_000,
  expect: {
    // Generous relative to a 360ms morph, but the machine may be busy building.
    timeout: 10_000,
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    // The docs register a demo-only service worker (`/api/slow-image` on static
    // hosts), which ramka's docs do not have and no spec uses. Playwright's
    // WebKit runs it in an extra web process per context, which doubled the
    // WebKit projects' memory and got two-worker runs OOM-killed on a 6 GiB box.
    serviceWorkers: 'block',
  },
  projects: [
    // ---------------------------------------------------------------------
    // Desktop. All three engines ship the View Transition API, so each is a
    // separate real implementation of the morph rather than a fallback arm.
    // They disagree on scroll-snap rounding and on how much of a gesture
    // reaches the scroller, which is precisely where the library keeps its
    // platform-specific workarounds.
    // ---------------------------------------------------------------------
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: DESKTOP_IGNORES,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: DESKTOP_IGNORES,
    },
    // Gecko is the arm that flips `isFirefox()`, which gates its own set of
    // View Transition workarounds. Nothing else in the matrix reaches them.
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: DESKTOP_IGNORES,
    },

    // ---------------------------------------------------------------------
    // Mobile. Emulated viewports with touch, not devices — see
    // `e2e/mobile/morph.spec.ts` for what that does and does not buy. They
    // are here because they flip platform gates no desktop project can:
    // `isAndroidBlinkSnapshotRoot()` on Pixel 7, and WebKit-with-touch on
    // iPhone.
    // ---------------------------------------------------------------------
    {
      name: 'android-chrome',
      use: { ...devices['Pixel 7'] },
      testMatch: MOBILE,
    },
    {
      name: 'ios-safari',
      use: { ...devices['iPhone 15'] },
      // `mobile/touch` drives touch sequences over CDP, which WebKit does not
      // speak. A synthetic-event fallback would test our own dispatch rather
      // than the browser's gesture handling, so those specs stay Chromium-only.
      testMatch: MOBILE,
      testIgnore: '**/mobile/touch/**',
    },
  ],
  webServer: {
    // `vite preview` serves the existing build; the build itself is a
    // prerequisite (`pnpm build`), so a run states which build it tested
    // instead of rebuilding behind the developer's back.
    command: `pnpm --filter docs exec vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
