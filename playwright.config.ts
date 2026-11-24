import { defineConfig } from "@playwright/test";

// The site is built with CLOUDFLARE_ENV=e2e (see `npm run test:e2e`), so it
// reads alters from the fake backend on 127.0.0.1:4599. The backend holds one
// scenario at a time, so tests run one after the other.
const SITE_PORT = 4321;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://127.0.0.1:${SITE_PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { browserName: "chromium", viewport: { width: 1280, height: 800 } },
    },
    {
      name: "mobile",
      use: {
        browserName: "chromium",
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: [
    {
      command: "node e2e/fake-backend.mjs",
      url: "http://127.0.0.1:4599/__health",
      reuseExistingServer: false,
    },
    {
      command: `astro preview --host 127.0.0.1 --port ${SITE_PORT}`,
      url: `http://127.0.0.1:${SITE_PORT}/`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
