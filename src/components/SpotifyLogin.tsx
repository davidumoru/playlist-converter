import React from 'react';
import { Music } from 'lucide-react';
import { SPOTIFY_AUTH_URL } from '../config/constants';
import { cn } from '../lib/utils';

export function SpotifyLogin() {
  return (
    <a
      href={SPOTIFY_AUTH_URL}
      className={cn(
        "inline-flex items-center space-x-2 px-6 py-3 rounded-md",
        "bg-green-600 hover:bg-green-700 text-white font-medium transition"
      )}
    >
      <Music className="w-5 h-5" />
      <span>Connect Spotify</span>
    </a>
  );
}