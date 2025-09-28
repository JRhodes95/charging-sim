import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environmentMatchGlobs: [
      // all tests in convex/ will run in edge-runtime
      ["convex/**", "edge-runtime"],
      // all other tests use jsdom
      ["**", "jsdom"],
    ],
    globals: true,
    server: { deps: { inline: ["convex-test"] } },
    setupFiles: ["./src/test/setup.ts"],
  },
});
