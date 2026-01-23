import { Music } from 'lucide-react';
import { buildSpotifyAuthUrl } from '../config/constants';
import { cn } from '../lib/utils';
import { generateCodeVerifier, generateCodeChallenge, storeCodeVerifier } from '../lib/pkce';

export function SpotifyLogin() {
  const handleLogin = async () => {
    const verifier = generateCodeVerifier();
    storeCodeVerifier(verifier);
    const challenge = await generateCodeChallenge(verifier);
    const authUrl = buildSpotifyAuthUrl(challenge);
    window.location.href = authUrl;
  };

  return (
    <button
      onClick={handleLogin}
      className={cn(
        "inline-flex items-center space-x-2 px-6 py-3 rounded-md",
        "bg-green-600 hover:bg-green-700 text-white font-medium transition"
      )}
    >
      <Music className="w-5 h-5" />
      <span>Connect Spotify</span>
    </button>
  );
}
