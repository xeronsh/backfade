import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const src = new URL("./src", import.meta.url).pathname;

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": src } },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    exclude: ["**/node_modules/**", "e2e/**", "dist/**"],
  },
});
