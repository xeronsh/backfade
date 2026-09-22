import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const apiProxyTarget =
  process.env.VITE_API_PROXY_TARGET ?? "http://127.0.0.1:8000";

/**
 * `cuer` (RainbowKit's QR renderer) calls `qr` with `border: 0` because it draws
 * its own quiet zone, but every `qr@>=0.4` release rejects that with
 * `RangeError: invalid border=0`, which takes the whole app down through the
 * error boundary. vendor/qr is qr@0.7.0 with that single guard relaxed to
 * `border < 0`; resolving the bare specifier here patches it for dev, build and
 * vitest at once, without touching the dependency tree.
 */
const qrCompat = fileURLToPath(new URL("./vendor/qr/index.js", import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
      qr: qrCompat,
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/v1": apiProxyTarget,
      "/health": apiProxyTarget,
    },
  },
  preview: {
    port: 4173,
    proxy: {
      "/v1": apiProxyTarget,
      "/health": apiProxyTarget,
    },
  },
});
