export const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
export const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || '';

// Determine the base URL based on environment
const BASE_URL = import.meta.env.PROD 
  ? 'https://unique-jalebi-8deebe.netlify.app'
  : 'http://localhost:5173';

export const SPOTIFY_REDIRECT_URI = `${BASE_URL}/callback`;
export const SPOTIFY_SCOPES = [
  'playlist-modify-public',
  'playlist-modify-private',
  'user-read-private',
].join(' ');

export const SPOTIFY_AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}&scope=${encodeURIComponent(SPOTIFY_SCOPES)}`;