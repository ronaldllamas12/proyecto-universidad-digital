import { defineConfig } from "cypress";

export default defineConfig({
  reporter: "spec",

  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? "http://localhost:3000",
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    experimentalRunAllSpecs: true,

    setupNodeEvents(on, config) {
      on("task", {
        log(message: string) {
          console.log(`  [cypress:log] ${message}`);
          return null;
        },
        table(data: Record<string, unknown>) {
          console.table(data);
          return null;
        },
      });

      // Force headless for Edge/Chrome in run mode (fixes Windows issue)
      on("before:browser:launch", (browser, launchOptions) => {
        if (
          browser.family === "chromium" &&
          browser.name !== "electron" &&
          config.isTextTerminal
        ) {
          launchOptions.args.push("--headless=new");
          launchOptions.args.push("--disable-gpu");
        }
        return launchOptions;
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
  screenshotOnRunFailure: true,

  env: {
    apiUrl: process.env.CYPRESS_API_URL ?? "http://127.0.0.1:8000",
    adminEmail: process.env.CYPRESS_ADMIN_EMAIL,
    adminPassword: process.env.CYPRESS_ADMIN_PASSWORD,
    runAgainstRealApi: process.env.CYPRESS_RUN_REAL_API === "true",
    maxResponseTimeMs: 3000,
  },
});
