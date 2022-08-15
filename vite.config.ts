import react from "@vitejs/plugin-react";
import Unocss from "unocss/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), Unocss({}), VitePWA({ registerType: "autoUpdate" })],
});
