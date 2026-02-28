import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? "http://127.0.0.1:5173",
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    setupNodeEvents(on) {
      on("task", {
        log(message: string) {
          console.log(message);
          return null;
        },
      });
    },
  },
  retries: {
    runMode: 2,
    openMode: 0,
  },
  defaultCommandTimeout: 10_000,
  requestTimeout: 15_000,
  responseTimeout: 20_000,
  pageLoadTimeout: 45_000,
  video: false,
  env: {
    apiUrl: process.env.CYPRESS_API_URL ?? "http://127.0.0.1:8000",
    adminEmail: process.env.CYPRESS_ADMIN_EMAIL ?? "admin@universidad.com",
    adminPassword: process.env.CYPRESS_ADMIN_PASSWORD ?? "password123456",
  },
});
