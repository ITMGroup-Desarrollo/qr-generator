import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  integrations: [react()],
  base: "/",
  vite: {
    server: {
      allowedHosts: ["countless-noninstinctively-julian.ngrok-free.dev"],
    },
  },
});
