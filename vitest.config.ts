import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Vitest runs the pure logic — festival dates, the fetch wrapper, the calculator
 * and formatting — on Node, with no browser and no network. That is deliberate:
 * these are the pieces where a wrong answer reaches a customer, and each one can
 * be checked without a deployment.
 */
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    reporters: "default",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
