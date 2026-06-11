import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from "astro:env/server";
import type { CreatedPlaylist, SpotifyMatch } from "../types";

const ACCOUNTS_BASE = "https://accounts.spotify.com";
const API_BASE = "https://api.spotify.com/v1";

const SCOPES = "playlist-modify-public playlist-modify-private";

export function redirectUri(origin: string): string {
  return `${origin}/api/auth/callback`;
}

export function authorizeUrl(origin: string, state: string): string {
  const url = new URL(`${ACCOUNTS_BASE}/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", SPOTIFY_CLIENT_ID);
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("redirect_uri", redirectUri(origin));
  url.searchParams.set("state", state);
  return url.toString();
}

export interface TokenSet {
  accessToken: string;
  refreshToken: string;
  /** Unix epoch milliseconds at which the access token expires. */
  expiresAt: number;
}

async function requestTokens(body: URLSearchParams): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}> {
  const credentials = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
  const response = await fetch(`${ACCOUNTS_BASE}/api/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!response.ok) {
    throw new Error(`Spotify token request failed (${response.status})`);
  }
  return response.json();
}

export async function exchangeCode(
  origin: string,
  code: string,
): Promise<TokenSet> {
  const data = await requestTokens(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(origin),
    }),
  );
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? "",
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export async function refreshTokens(refreshToken: string): Promise<TokenSet> {
  const data = await requestTokens(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  );
  return {
    accessToken: data.access_token,
    // Spotify only rotates the refresh token sometimes; keep the old one otherwise.
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

async function spotifyFetch(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<unknown> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(
      `Spotify API request failed (${response.status}) for ${path}`,
    );
  }
  return response.json();
}

interface SearchResponse {
  tracks: {
    items: Array<{
      uri: string;
      name: string;
      artists: Array<{ name: string }>;
      album: { name: string; images: Array<{ url: string }> };
    }>;
  };
}

export async function searchTrack(
  accessToken: string,
  query: string,
): Promise<SpotifyMatch | null> {
  const params = new URLSearchParams({ q: query, type: "track", limit: "1" });
  const data = (await spotifyFetch(
    accessToken,
    `/search?${params}`,
  )) as SearchResponse;

  const track = data.tracks.items[0];
  if (!track) return null;

  return {
    uri: track.uri,
    name: track.name,
    artists: track.artists.map((artist) => artist.name),
    albumName: track.album.name,
    albumArtUrl: track.album.images.at(-1)?.url ?? null,
  };
}

export async function createPlaylist(
  accessToken: string,
  name: string,
  uris: string[],
): Promise<CreatedPlaylist> {
  const me = (await spotifyFetch(accessToken, "/me")) as { id: string };

  const playlist = (await spotifyFetch(
    accessToken,
    `/users/${me.id}/playlists`,
    {
      method: "POST",
      body: JSON.stringify({
        name,
        public: false,
        description: "Converted from YouTube",
      }),
    },
  )) as { id: string; external_urls: { spotify: string } };

  // The add-tracks endpoint caps at 100 URIs per call.
  for (let i = 0; i < uris.length; i += 100) {
    await spotifyFetch(accessToken, `/playlists/${playlist.id}/tracks`, {
      method: "POST",
      body: JSON.stringify({ uris: uris.slice(i, i + 100) }),
    });
  }

  return { id: playlist.id, name, url: playlist.external_urls.spotify };
}
