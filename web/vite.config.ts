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
  // PHASE 10: the Cloudflare Tunnel reaches the preview server over a public
  // *.trycloudflare.com hostname, which is not on Vite's default allow list.
  preview: {
    allowedHosts: [".trycloudflare.com"],
    proxy: {
      "/v1": "http://127.0.0.1:8000",
    },
  },
});
