export interface YouTubePlaylist {
  id: string;
  title: string;
  items: YouTubePlaylistItem[];
}

export interface YouTubePlaylistItem {
  id: string;
  title: string;
  artist?: string;
  duration: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  uri: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  tracks: SpotifyTrack[];
}

export interface ConversionResult {
  totalTracks: number;
  matchedTracks: number;
  playlistId: string | null;
  playlistUrl: string | null;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export type ConversionStatus =
  | "idle"
  | "fetching-youtube"
  | "searching-spotify"
  | "creating-playlist"
  | "completed"
  | "error";
