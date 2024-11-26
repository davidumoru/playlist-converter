import axios from 'axios';
import type { YouTubePlaylist, SpotifyTrack } from '../types';
import { YOUTUBE_API_KEY } from '../config/constants';

export async function fetchYouTubePlaylist(playlistId: string): Promise<YouTubePlaylist> {
  // First, fetch the playlist details to get the title
  const playlistResponse = await axios.get(
    `https://www.googleapis.com/youtube/v3/playlists`,
    {
      params: {
        part: 'snippet',
        id: playlistId,
        key: YOUTUBE_API_KEY,
      },
    }
  );

  const playlistTitle = playlistResponse.data.items[0]?.snippet?.title || 'Untitled Playlist';

  // Then fetch the playlist items
  const response = await axios.get(
    `https://www.googleapis.com/youtube/v3/playlistItems`,
    {
      params: {
        part: 'snippet,contentDetails',
        maxResults: 50,
        playlistId,
        key: YOUTUBE_API_KEY,
      },
    }
  );

  return {
    id: playlistId,
    title: playlistTitle,
    items: response.data.items.map((item: any) => ({
      id: item.contentDetails.videoId,
      title: item.snippet.title,
      duration: 0, // Would need additional API call to get duration
    })),
  };
}

export async function searchSpotifyTrack(
  query: string,
  token: string
): Promise<SpotifyTrack | null> {
  try {
    const response = await axios.get(
      `https://api.spotify.com/v1/search`,
      {
        params: {
          q: query,
          type: 'track',
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
    console.error('Error searching Spotify track:', error);
    return null;
  }
}

export async function createSpotifyPlaylist(
  token: string,
  name: string,
  trackUris: string[]
): Promise<string | null> {
  try {
    // Get user ID
    const userResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Create playlist
    const playlistResponse = await axios.post(
      `https://api.spotify.com/v1/users/${userResponse.data.id}/playlists`,
      {
        name,
        description: 'Converted from YouTube playlist',
        public: false,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // Add tracks to playlist
    await axios.post(
      `https://api.spotify.com/v1/playlists/${playlistResponse.data.id}/tracks`,
      {
        uris: trackUris,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return playlistResponse.data.id;
  } catch (error) {
    console.error('Error creating Spotify playlist:', error);
    return null;
  }
}