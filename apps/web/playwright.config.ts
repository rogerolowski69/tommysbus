import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests run against a live stack: Postgres + Django (seeded with `seed_demo`) must be up.
 * The Next.js dev server is started automatically unless one is already running on :3000.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  expect: { timeout: 10_000 }, // API-backed steps can be slow on a loaded dev machine
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    // Optional: E2E_CHANNEL=chrome uses an installed Google Chrome instead of bundled Chromium.
    ...(process.env.E2E_CHANNEL ? { channel: process.env.E2E_CHANNEL } : {}),
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000/healthz",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
