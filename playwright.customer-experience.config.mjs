import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./playwright",
  testMatch: ["customer-experience.spec.js", "portal-authenticated.spec.js"],
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  fullyParallel: false,
  retries: 0,
  reporter: [
    ["list"],
    ["json", { outputFile: "qa/results/customer-experience-playwright.json" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
