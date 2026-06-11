// @ts-check
import { defineConfig, envField } from "astro/config";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  adapter: vercel(),
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
});
