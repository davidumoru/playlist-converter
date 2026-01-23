import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getStoredCodeVerifier, clearCodeVerifier } from '../lib/pkce';
import { SPOTIFY_CLIENT_ID, SPOTIFY_REDIRECT_URI, SPOTIFY_TOKEN_URL } from '../config/constants';

export function CallbackHandler() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setSpotifyToken = useAuthStore((state) => state.setSpotifyToken);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(errorParam);
      return;
    }

    if (code) {
      exchangeCodeForToken(code);
    }

    async function exchangeCodeForToken(code: string) {
      const verifier = getStoredCodeVerifier();

      if (!verifier) {
        setError('Missing code verifier. Please try logging in again.');
        return;
      }

      try {
        const response = await fetch(SPOTIFY_TOKEN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: SPOTIFY_CLIENT_ID,
            grant_type: 'authorization_code',
            code,
            redirect_uri: SPOTIFY_REDIRECT_URI,
            code_verifier: verifier,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error_description || errorData.error || 'Token exchange failed');
        }

        const data = await response.json();
        clearCodeVerifier();
        setSpotifyToken(data.access_token);
        navigate('/');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to authenticate');
      }
    }
  }, [searchParams, navigate, setSpotifyToken]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-red-600">Authentication Failed</h2>
          <p className="text-gray-600 mb-4">Error: {error}</p>
          <a href="/" className="text-blue-600 hover:underline">Go back and try again</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Connecting to Spotify...</h2>
        <p className="text-gray-600">Please wait while we complete the authentication.</p>
      </div>
    </div>
  );
}