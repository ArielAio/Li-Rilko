import { defineConfig } from "vitest/config";
import { createBaseConfig } from "./vitest.shared";

export default defineConfig({
  ...createBaseConfig(),
  test: {
    environment: "jsdom",
    include: ["tests/integration/**/*.test.{js,jsx}"],
    setupFiles: ["tests/setup/jsdom.setup.js"],
    restoreMocks: true,
    clearMocks: true,
  },
});
