import type { APIRoute } from "astro";
import { fetchPlaylist, parsePlaylistId } from "../../../lib/youtube";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const input = url.searchParams.get("url");
  if (!input) {
    return Response.json(
      { error: 'Missing "url" query parameter' },
      { status: 400 },
    );
  }

  const playlistId = parsePlaylistId(input);
  if (!playlistId) {
    return Response.json(
      { error: "Not a YouTube playlist URL or ID" },
      { status: 400 },
    );
  }

  const playlist = await fetchPlaylist(playlistId);
  if (!playlist) {
    return Response.json(
      { error: "Playlist not found (is it public?)" },
      { status: 404 },
    );
  }

  return Response.json(playlist);
};
