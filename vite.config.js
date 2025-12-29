import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/detect-sector": {
        target: "http://localhost:3000",
        changeOrigin: true
      },
      "/generate-petition": {
        target: "http://localhost:3000",
        changeOrigin: true
      }
    }
  }
});
