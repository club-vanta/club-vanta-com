import { defineConfig } from "vitest/config";

// Plain Node config: the unit tests cover pure logic, not Astro or workerd.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
