import type { APIRoute } from "astro";
import { searchTrack } from "../../../lib/spotify";
import { getAccessToken } from "../../../lib/session";
import { buildSearchQuery } from "../../../lib/match";
import type { YouTubeTrack } from "../../../types";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const accessToken = await getAccessToken(cookies);
  if (!accessToken) {
    return Response.json(
      { error: "Not logged in to Spotify" },
      { status: 401 },
    );
  }

  const track = (await request.json()) as Partial<YouTubeTrack>;
  if (typeof track.title !== "string" || track.title.length === 0) {
    return Response.json(
      { error: 'Body must include a track "title"' },
      { status: 400 },
    );
  }

  const query = buildSearchQuery({
    videoId: track.videoId ?? "",
    title: track.title,
    channelTitle: track.channelTitle ?? "",
  });

  const match = await searchTrack(accessToken, query);
  return Response.json({ match });
};
