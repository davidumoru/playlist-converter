# Crossfade

Move a playlist from YouTube to Spotify.

![Crossfade home screenshot](/public/home.jpeg)

## Setup

1. Copy `.env.example` to `.env` and fill in the values:
   - `YOUTUBE_API_KEY` — from the Google Cloud console (YouTube Data API v3)
   - `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` — from the
     [Spotify developer dashboard](https://developer.spotify.com/dashboard)
2. In the Spotify app settings, add `http://127.0.0.1:4321/api/auth/callback`
   (and your production origin's equivalent) to the redirect URIs. Spotify no
   longer accepts `localhost` — use the IP form, and open the dev site at
   `http://127.0.0.1:4321` so the derived redirect URI matches.
3. `pnpm install && pnpm dev`

## How it works

The conversion is orchestrated by the client in three steps, so each request
stays small and the UI can show real progress:

1. `GET /api/youtube/playlist?url=...` — resolves a playlist URL/ID to its
   title and tracks
2. `POST /api/spotify/search` — called once per track, returns the best
   Spotify match (titles are cleaned of "(Official Video)"-style noise first)
3. `POST /api/spotify/playlist` — creates the playlist from the matched URIs

Auth endpoints: `/api/auth/login`, `/api/auth/callback`, `/api/auth/logout`,
`/api/auth/status`.

## Project structure

```text
src/
├── components/
│   └── Converter.svelte      # the whole UI (Svelte island)
├── lib/
│   ├── client/
│   │   └── converter.svelte.ts  # client-side conversion state machine
│   ├── youtube.ts    # YouTube Data API client (server-only)
│   ├── spotify.ts    # Spotify OAuth + Web API client (server-only)
│   ├── session.ts    # token cookies + transparent refresh
│   └── match.ts      # title cleaning / search-query building
├── pages/
│   ├── api/          # server endpoints (see above)
│   └── index.astro
└── types.ts          # shared types
```

## Commands

| Command            | Action                               |
| :----------------- | :----------------------------------- |
| `pnpm dev`         | Start dev server at `localhost:4321` |
| `pnpm build`       | Build for production                 |
| `pnpm preview`     | Preview the production build locally |
| `pnpm astro check` | Typecheck                            |
