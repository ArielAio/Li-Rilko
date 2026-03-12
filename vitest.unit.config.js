import { defineConfig } from "vitest/config";
import { createBaseConfig } from "./vitest.shared";

export default defineConfig({
  ...createBaseConfig(),
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.js"],
    setupFiles: ["tests/setup/unit.setup.js"],
    restoreMocks: true,
    clearMocks: true,
  },
});
