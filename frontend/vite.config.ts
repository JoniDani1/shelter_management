import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Served by Firebase Hosting at /app/. `npm run build` writes into
// ../public/app so the normal deploy (hosting: public/) picks it up.
export default defineConfig({
  base: "/app/",
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  build: { outDir: "../public/app", emptyOutDir: true },
});
