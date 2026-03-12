import { defineConfig } from "vitest/config";
import { createBaseConfig } from "./vitest.shared";

export default defineConfig({
  ...createBaseConfig(),
  test: {
    environment: "jsdom",
    include: ["tests/known-issues/**/*.test.{js,jsx}"],
    setupFiles: ["tests/setup/jsdom.setup.js"],
    restoreMocks: true,
    clearMocks: true,
    reporters: process.env.CI ? ["default", "junit"] : ["default"],
    outputFile: process.env.CI ? { junit: "./test-results/known-issues-junit.xml" } : undefined,
  },
});
