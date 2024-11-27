import React, { useState } from 'react';
import { Music, Youtube, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { SpotifyLogin } from './SpotifyLogin';
import { fetchYouTubePlaylist, searchSpotifyTrack, createSpotifyPlaylist } from '../lib/api';

export function PlaylistConverter() {
  const [url, setUrl] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [success, setSuccess] = useState<{ playlistId: string; playlistName: string } | null>(null);
  const spotifyToken = useAuthStore((state) => state.spotifyToken);

  const extractPlaylistId = (url: string) => {
    const match = url.match(/[?&]list=([^&]+)/);
    return match ? match[1] : null;
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsConverting(true);
    setProgress(0);
    setSuccess(null);

    try {
      const youtubePlaylistId = extractPlaylistId(url);
      if (!youtubePlaylistId) {
        throw new Error('Invalid YouTube playlist URL');
      }

      // Fetch YouTube playlist
      const playlist = await fetchYouTubePlaylist(youtubePlaylistId);
      const totalTracks = playlist.items.length;

      // Convert tracks
      const spotifyUris: string[] = [];
      for (let i = 0; i < playlist.items.length; i++) {
        const item = playlist.items[i];
        const query = `${item.title}`;
        const spotifyTrack = await searchSpotifyTrack(query, spotifyToken!);
        
        if (spotifyTrack) {
          spotifyUris.push(spotifyTrack.uri);
        }
        
        setProgress(Math.round(((i + 1) / totalTracks) * 100));
      }

      // Create Spotify playlist with exact YouTube playlist name
      const spotifyPlaylistId = await createSpotifyPlaylist(
        spotifyToken!,
        playlist.title,
        spotifyUris
      );

      if (!spotifyPlaylistId) {
        throw new Error('Failed to create Spotify playlist');
      }

      setSuccess({
        playlistId: spotifyPlaylistId,
        playlistName: playlist.title
      });
      setUrl('');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsConverting(false);
    }
  };

  const handleReset = () => {
    setSuccess(null);
    setProgress(0);
    setError(null);
  };

  if (!spotifyToken) {
    return (
      <div className="text-center">
        <p className="mb-4 text-gray-600">Connect your Spotify account to start</p>
        <SpotifyLogin />
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
          <h3 className="text-2xl font-semibold text-gray-900">Playlist Converted!</h3>
          <p className="text-gray-600">
            "{success.playlistName}" has been successfully created in your Spotify account.
          </p>
        </div>
        <a
          href={`https://open.spotify.com/playlist/${success.playlistId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition"
        >
          Open in Spotify
        </a>
        <button
          onClick={handleReset}
          className="block mx-auto mt-4 text-gray-600 hover:text-gray-900"
        >
          Convert Another Playlist
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-center space-x-4 mb-8">
        <Youtube className="w-8 h-8 text-red-600" />
        <div className="h-0.5 w-12 bg-gray-300" />
        <Music className="w-8 h-8 text-green-600" />
      </div>

      <form onSubmit={handleConvert} className="space-y-6">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            YouTube Playlist URL
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/playlist?list=..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {isConverting && (
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 text-center">
              Converting... {progress}%
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isConverting}
          className={cn(
            "w-full py-3 px-4 rounded-md text-white font-medium transition flex items-center justify-center space-x-2",
            isConverting
              ? "bg-indigo-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          )}
        >
          {isConverting && <Loader2 className="w-5 h-5 animate-spin" />}
          <span>{isConverting ? "Converting..." : "Convert to Spotify"}</span>
        </button>
      </form>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">How it works</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-600">
          <li>Connect your Spotify account</li>
          <li>Paste your YouTube playlist URL</li>
          <li>Click convert and wait while we match the songs</li>
          <li>Access your converted playlist on Spotify</li>
        </ol>
      </div>
    </div>
  );
}