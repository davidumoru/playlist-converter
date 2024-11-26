import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  spotifyToken: string | null;
  setSpotifyToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      spotifyToken: null,
      setSpotifyToken: (token) => set({ spotifyToken: token }),
    }),
    {
      name: 'auth-storage',
    }
  )
);