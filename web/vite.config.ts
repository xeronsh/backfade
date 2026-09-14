import { defineConfig } from "vite";

export default defineConfig({
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
});
