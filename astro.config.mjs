// @ts-check
import { defineConfig, envField } from "astro/config";
import vercel from "@astrojs/vercel";

import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
  adapter: vercel(),

  // Spotify only accepts loopback-IP redirect URIs, so dev must serve on IPv4.
  server: { host: "127.0.0.1" },

  env: {
    schema: {
      YOUTUBE_API_KEY: envField.string({ context: "server", access: "secret" }),
      SPOTIFY_CLIENT_ID: envField.string({
        context: "server",
        access: "secret",
      }),
      SPOTIFY_CLIENT_SECRET: envField.string({
        context: "server",
        access: "secret",
      }),
    },
  },

  integrations: [svelte()],
});
