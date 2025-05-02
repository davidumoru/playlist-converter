import axios from "axios";
import type {
  YouTubePlaylist,
  SpotifyTrack,
  YouTubePlaylistItem,
} from "../types";
import { YOUTUBE_API_KEY } from "../config/constants";

export async function fetchYouTubePlaylist(
  playlistId: string
): Promise<YouTubePlaylist> {
  interface YouTubePlaylistResponse {
    items: Array<{
      snippet: {
        title: string;
      };
    }>;
  }

  const playlistResponse = await axios.get<YouTubePlaylistResponse>(
    "https://www.googleapis.com/youtube/v3/playlists",
    {
      params: {
        part: "snippet",
        id: playlistId,
        key: YOUTUBE_API_KEY,
      },
    }
  );

  if (
    !playlistResponse.data.items ||
    playlistResponse.data.items.length === 0
  ) {
    throw new Error("Playlist not found");
  }

  const playlistTitle =
    playlistResponse.data.items[0]?.snippet?.title || "Untitled Playlist";

  async function fetchAllPlaylistItems(
    playlistId: string
  ): Promise<YouTubePlaylistItem[]> {
    let allItems: YouTubePlaylistItem[] = [];
    let nextPageToken: string | undefined = undefined;

    interface YouTubeApiResponse {
      items: Array<{
        snippet: {
          title: string;
          description?: string;
        };
        contentDetails: {
          videoId: string;
        };
      }>;
      nextPageToken?: string;
    }

    do {
      const response: { data: YouTubeApiResponse } =
        await axios.get<YouTubeApiResponse>(
          "https://www.googleapis.com/youtube/v3/playlistItems",
          {
            params: {
              part: "snippet,contentDetails",
              maxResults: 50,
              playlistId,
              pageToken: nextPageToken,
              key: YOUTUBE_API_KEY,
            },
          }
        );

      const items: YouTubePlaylistItem[] = response.data.items.map(
        (item: {
          snippet: {
            title: string;
          };
          contentDetails: {
            videoId: string;
          };
        }) => ({
          id: item.contentDetails.videoId,
          title: item.snippet.title,
          artist: extractArtistFromTitle(item.snippet.title),
          duration: 0,
        })
      );

      allItems = [...allItems, ...items];
      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);

    return allItems;
  }

  function extractArtistFromTitle(title: string): string | undefined {
    const patterns = [/\s*-\s*([^-]+)/, /\s*by\s+([^(]+)/, /\(([^)]+)\)/];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  const items = await fetchAllPlaylistItems(playlistId);

  return {
    id: playlistId,
    title: playlistTitle,
    items,
  };
}

export async function searchSpotifyTrack(
  query: string,
  token: string
): Promise<SpotifyTrack | null> {
  if (!query.trim() || !token) {
    return null;
  }

  try {
    const cleanQuery = query.replace(/\([^)]*\)/g, "").trim();

    interface SpotifySearchResponse {
      tracks: {
        items: Array<{
          id: string;
          name: string;
          artists: Array<{ name: string }>;
          uri: string;
        }>;
      };
    }

    const response = await axios.get<SpotifySearchResponse>(
      "https://api.spotify.com/v1/search",
      {
        params: {
          q: cleanQuery,
          type: "track",
          limit: 1,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const track = response.data.tracks.items[0];

    return track
      ? {
          id: track.id,
          name: track.name,
          artists: track.artists,
          uri: track.uri,
        }
      : null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new Error("Spotify token expired");
    }

    console.error("Error searching Spotify track:", error);
    return null;
  }
}

export async function createSpotifyPlaylist(
  token: string,
  name: string,
  trackUris: string[]
): Promise<string | null> {
  if (!token || !name || !trackUris.length) {
    return null;
  }

  try {
    interface SpotifyUserResponse {
      id: string;
    }

    interface SpotifyPlaylistResponse {
      id: string;
    }

    const userResponse = await axios.get<SpotifyUserResponse>(
      "https://api.spotify.com/v1/me",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const userId = userResponse.data.id;

    const playlistResponse = await axios.post<SpotifyPlaylistResponse>(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        name,
        description: "Converted from YouTube playlist",
        public: false,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const playlistId = playlistResponse.data.id;

    const chunkSize = 100;
    for (let i = 0; i < trackUris.length; i += chunkSize) {
      const chunk = trackUris.slice(i, i + chunkSize);

      await axios.post(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          uris: chunk,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return playlistId;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error("Spotify token expired");
      } else if (error.response?.status === 403) {
        throw new Error("Permission denied: Cannot create playlist");
      }
    }

    console.error("Error creating Spotify playlist:", error);
    return null;
  }
}

export async function getYouTubeVideoMetadata(
  videoId: string
): Promise<{ title: string; duration: number }> {
  try {
    interface YouTubeVideoResponse {
      items: Array<{
        snippet: {
          title: string;
        };
        contentDetails: {
          duration: string;
        };
      }>;
    }

    const response = await axios.get<YouTubeVideoResponse>(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          part: "snippet,contentDetails",
          id: videoId,
          key: YOUTUBE_API_KEY,
        },
      }
    );

    if (!response.data.items || response.data.items.length === 0) {
      throw new Error("Video not found");
    }

    const item = response.data.items[0];
    const duration = parseDuration(item.contentDetails.duration);

    return {
      title: item.snippet.title,
      duration,
    };
  } catch (error) {
    console.error("Error fetching YouTube video metadata:", error);
    return { title: "Unknown", duration: 0 };
  }
}

function parseDuration(ytDuration: string): number {
  const matches = ytDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!matches) {
    return 0;
  }

  const hours = parseInt(matches[1] || "0", 10);
  const minutes = parseInt(matches[2] || "0", 10);
  const seconds = parseInt(matches[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
}
