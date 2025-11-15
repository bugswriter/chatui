import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  preview: {
    allowedHosts: ['test.bugswriter.ai', "localhost:5173"],   // <-- add this
    host: true,
    port: 4173
  }
});
