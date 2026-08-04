import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const isTermux = !!process.env.PREFIX?.includes("com.termux");

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      selfDestroying: true,
      registerType: "autoUpdate",

      // helps Chrome detect manifest assets
      includeAssets: [
        "petitiondesk-mark.svg",
        "petitiondesk-logo.svg",
        "favicon.svg",
        "logo.jpg",
        "pwa-192.png",
        "pwa-512.png",
        "pwa-512-maskable.png"
      ],

      manifest: {
        name: "PetitionDesk",
        short_name: "PetitionDesk",
        description:
          "Write a clear petition and find the right delivery route.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0b5a3c",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "/pwa-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },

      // ✅ THIS IS THE TERMUX FIX (avoids terser crash)
      workbox: {
        mode: isTermux ? "development" : "production",
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      },

      // so you can test install on localhost (Chrome treats localhost as secure)
      devOptions: {
        enabled: true
      }
    })
  ],

  build: {
    minify: "esbuild"
  }
});
