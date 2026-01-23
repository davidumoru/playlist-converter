// PKCE (Proof Key for Code Exchange) utilities for Spotify OAuth

export function generateCodeVerifier(): string {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(array: Uint8Array): string {
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Store the code verifier in sessionStorage so it persists across the redirect
export function storeCodeVerifier(verifier: string): void {
  sessionStorage.setItem('spotify_code_verifier', verifier);
}

export function getStoredCodeVerifier(): string | null {
  return sessionStorage.getItem('spotify_code_verifier');
}

export function clearCodeVerifier(): void {
  sessionStorage.removeItem('spotify_code_verifier');
}
