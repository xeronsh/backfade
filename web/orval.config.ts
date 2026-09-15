import { defineConfig } from "orval";

export default defineConfig({
  backfade: {
    input: { target: "../api/openapi.json" },
    output: {
      mode: "single",
      target: "./src/lib/api/generated/index.ts",
      schemas: "./src/lib/api/generated/model",
      client: "react-query",
      clean: true,
      override: {
        mutator: {
          path: "./src/lib/api/http.ts",
          name: "apiClient",
        },
      },
    },
  },
});
