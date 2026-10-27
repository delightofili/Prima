import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// One build time, used both inside the app (__BUILD__) and in version.json, so the two can be compared
const BUILD = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";

// Writes dist/version.json, so a phone can ask the server which build is live
const versionFile = (): Plugin => ({
  name: "prima-version-file",
  generateBundle() {
    this.emitFile({
      type: "asset",
      fileName: "version.json",
      source: JSON.stringify({ build: BUILD }),
    });
  },
});

// Which npm package a file belongs to, e.g. "recharts" or "@supabase/supabase-js"
const packageOf = (id: string) => {
  const parts = (id.split("node_modules/").pop() ?? "").split("/");
  return parts[0].startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
};

const CHUNKS: Record<string, string[]> = {
  react: [
    "react",
    "react-dom",
    "react-router",
    "react-router-dom",
    "scheduler",
  ],
  charts: ["recharts", "d3-*", "victory-vendor", "recharts-scale"],
  data: ["dexie", "dexie-react-hooks"],
  supabase: ["@supabase/*"],
  forms: ["react-hook-form", "zod", "@hookform/resolvers"],
};

export default defineConfig({
  // Shown on the Phone check page and the App version card, so you can see which version a phone is really running
  define: {
    __BUILD__: JSON.stringify(BUILD),
  },
  plugins: [
    react(),
    tailwindcss(),
    versionFile(),
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
          {
            name: "Scan a patient card",
            short_name: "Scan",
            url: "/scan",
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
        // Big libraries get their own files with stable names, so an update downloads only what changed.
        // (A function, because it works with every recent Vite. The object form fails on Vite 8.)
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          const name = packageOf(id);
          for (const [chunk, packages] of Object.entries(CHUNKS)) {
            if (
              packages.some((p) =>
                p.endsWith("*") ? name.startsWith(p.slice(0, -1)) : name === p,
              )
            )
              return chunk;
          }
          return undefined;
        },
      },
    },
  },
});
