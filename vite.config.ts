import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // Shown on the Phone check page, so you can see which version a phone is really running
  define: {
    __BUILD__: JSON.stringify(
      new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC",
    ),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt", // a new version waits until the person taps "Update now"
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        id: "/",
        name: "Prima: patient register",
        short_name: "Prima",
        description:
          "Offline-first patient register and visit record for primary health centres.",
        lang: "en-NG",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#0F766E",
        background_color: "#FFFBEB",
        categories: ["medical", "health", "productivity"],
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "Register a patient",
            short_name: "Register",
            url: "/register",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }],
          },
          {
            name: "Find a patient",
            short_name: "Patients",
            url: "/patients",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest}"],
        navigateFallback: "/index.html", // every route opens offline
        cleanupOutdatedCaches: true,
        clientsClaim: true, // the first install controls the page at once, so offline works without a second visit
        maximumFileSizeToCacheInBytes: 3_000_000,
        runtimeCaching: [], // on purpose: nothing from Supabase or the Python service is ever cached
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Big libraries get their own files with stable names, so an update downloads only what changed
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");
          const chunks = {
            react: ["react", "react-dom", "react-router-dom"],
            charts: ["recharts"],
            data: ["dexie", "dexie-react-hooks"],
            supabase: ["@supabase/supabase-js"],
            forms: ["react-hook-form", "zod", "@hookform/resolvers"],
          };

          for (const [chunk, packages] of Object.entries(chunks)) {
            if (
              packages.some((name) =>
                normalizedId.includes(`/node_modules/${name}/`),
              )
            ) {
              return chunk;
            }
          }
        },
      },
    },
  },
});
