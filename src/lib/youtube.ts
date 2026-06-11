import { YOUTUBE_API_KEY } from "astro:env/server";
import type { YouTubePlaylist, YouTubeTrack } from "../types";

const API_BASE = "https://www.googleapis.com/youtube/v3";

// Placeholder titles the API returns for videos that can no longer be played.
const UNAVAILABLE_TITLES = new Set(["Deleted video", "Private video"]);

export function parsePlaylistId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[A-Za-z0-9_-]{13,42}$/.test(trimmed) && !trimmed.includes(".")) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed);
    return url.searchParams.get("list");
  } catch {
    return null;
  }
}

async function youtubeGet(
  path: string,
  params: Record<string, string>,
): Promise<unknown> {
  const url = new URL(`${API_BASE}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("key", YOUTUBE_API_KEY);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `YouTube API request failed (${response.status}) for ${path}`,
    );
  }
  return response.json();
}

interface PlaylistListResponse {
  items?: Array<{ snippet: { title: string } }>;
}

interface PlaylistItemsResponse {
  items?: Array<{
    snippet: { title: string; videoOwnerChannelTitle?: string };
    contentDetails: { videoId: string };
  }>;
  nextPageToken?: string;
}

export async function fetchPlaylist(
  playlistId: string,
): Promise<YouTubePlaylist | null> {
  const playlistData = (await youtubeGet("playlists", {
    part: "snippet",
    id: playlistId,
  })) as PlaylistListResponse;

  const playlistSnippet = playlistData.items?.[0]?.snippet;
  if (!playlistSnippet) {
    return null;
  }

  const tracks: YouTubeTrack[] = [];
  const seen = new Set<string>();
  let pageToken: string | undefined;
  let pages = 0;

  do {
    const page = (await youtubeGet("playlistItems", {
      part: "snippet,contentDetails",
      playlistId,
      maxResults: "50",
      ...(pageToken ? { pageToken } : {}),
    })) as PlaylistItemsResponse;

    let added = 0;
    for (const item of page.items ?? []) {
      if (UNAVAILABLE_TITLES.has(item.snippet.title)) continue;
      if (seen.has(item.contentDetails.videoId)) continue;
      seen.add(item.contentDetails.videoId);
      tracks.push({
        videoId: item.contentDetails.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.videoOwnerChannelTitle ?? "",
      });
      added++;
    }

    // Auto-generated radio playlists (RD…) return a nextPageToken forever,
    // recycling the same videos — stop once a page adds nothing new.
    if (added === 0) break;
    pageToken = page.nextPageToken;
  } while (pageToken && ++pages < 100);

  return { id: playlistId, title: playlistSnippet.title, tracks };
}
