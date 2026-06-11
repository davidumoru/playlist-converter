export interface YouTubeTrack {
  videoId: string;
  title: string;
  channelTitle: string;
}

export interface YouTubePlaylist {
  id: string;
  title: string;
  tracks: YouTubeTrack[];
}

export interface SpotifyMatch {
  uri: string;
  name: string;
  artists: string[];
  albumName: string;
  albumArtUrl: string | null;
}

export interface CreatedPlaylist {
  id: string;
  name: string;
  url: string;
}
