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