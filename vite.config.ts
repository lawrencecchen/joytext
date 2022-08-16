import react from "@vitejs/plugin-react";
import Unocss from "unocss/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import presetWind from "@unocss/preset-wind";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    Unocss({
      presets: [presetWind()],
    }),
    VitePWA({ registerType: "autoUpdate" }),
  ],
});
