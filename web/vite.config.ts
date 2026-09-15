import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        index: "index.html",
        create: "create.html",
        market: "market.html",
        profile: "profile.html",
      },
    },
  },
  server: {
    proxy: {
      "/v1": "http://localhost:8000",
    },
  },
  // The preview server is reachable through a Cloudflare Tunnel, whose Host header is not on
  // Vite's default allow list. /v1 is proxied here too, so one tunnel serves the whole app
  // same-origin and the browser never makes a cross-origin API call.
  preview: {
    allowedHosts: [".trycloudflare.com", ".backfade.fun"],
    proxy: {
      "/v1": "http://127.0.0.1:8000",
    },
  },
});
