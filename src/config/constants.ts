export const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
export const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || '';

// Determine the base URL based on environment
const BASE_URL = import.meta.env.VITE_BASE_URL
  || (import.meta.env.PROD
    ? 'https://playlist.davidumoru.me'
    : 'http://localhost:5173');

export const SPOTIFY_REDIRECT_URI = `${BASE_URL}/callback`;
export const SPOTIFY_SCOPES = [
  'playlist-modify-public',
  'playlist-modify-private',
  'user-read-private',
].join(' ');

export const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

export function buildSpotifyAuthUrl(codeChallenge: string): string {
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: SPOTIFY_SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}
