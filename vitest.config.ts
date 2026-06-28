import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    exclude: ["**/node_modules/**", "**/dist/**"],
    isolate: false,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
