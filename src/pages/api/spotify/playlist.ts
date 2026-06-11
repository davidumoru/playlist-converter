import type { APIRoute } from "astro";
import { createPlaylist } from "../../../lib/spotify";
import { getAccessToken } from "../../../lib/session";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const accessToken = await getAccessToken(cookies);
  if (!accessToken) {
    return Response.json(
      { error: "Not logged in to Spotify" },
      { status: 401 },
    );
  }

  const body = (await request.json()) as { name?: unknown; uris?: unknown };
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const uris = Array.isArray(body.uris)
    ? body.uris.filter(
        (uri): uri is string =>
          typeof uri === "string" && uri.startsWith("spotify:track:"),
      )
    : [];

  if (!name || uris.length === 0) {
    return Response.json(
      {
        error:
          'Body must include a playlist "name" and a non-empty "uris" array',
      },
      { status: 400 },
    );
  }

  const playlist = await createPlaylist(accessToken, name, uris);
  return Response.json(playlist, { status: 201 });
};
