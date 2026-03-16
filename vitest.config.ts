import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["lcov", "text"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.spec.ts", "src/types.*"],
    },
  },
});
