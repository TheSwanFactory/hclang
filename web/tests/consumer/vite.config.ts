import { fresh } from "@fresh/plugin-vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    fresh({
      islandSpecifiers: ["@swanfactory/hcweb/islands/Main"],
    }),
  ],
});
