import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function CallbackHandler() {
  const navigate = useNavigate();
  const setSpotifyToken = useAuthStore((state) => state.setSpotifyToken);

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get('access_token');

    if (token) {
      setSpotifyToken(token);
      navigate('/');
    }
  }, [navigate, setSpotifyToken]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Connecting to Spotify...</h2>
        <p className="text-gray-600">Please wait while we complete the authentication.</p>
      </div>
    </div>
  );
}