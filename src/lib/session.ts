import type { AstroCookies } from "astro";
import { refreshTokens, type TokenSet } from "./spotify";

const ACCESS_COOKIE = "sp_access";
const REFRESH_COOKIE = "sp_refresh";
export const STATE_COOKIE = "sp_oauth_state";

const COOKIE_OPTIONS = {
  path: "/",
  httpOnly: true,
  sameSite: "lax",
  secure: import.meta.env.PROD,
} as const;

const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

export function storeTokens(cookies: AstroCookies, tokens: TokenSet): void {
  // Expire the access cookie a minute early so we never hand out a stale token.
  const accessMaxAge = Math.max(
    0,
    Math.floor((tokens.expiresAt - Date.now()) / 1000) - 60,
  );
  cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: accessMaxAge,
  });
  cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: REFRESH_MAX_AGE,
  });
}

export function clearSession(cookies: AstroCookies): void {
  cookies.delete(ACCESS_COOKIE, { path: "/" });
  cookies.delete(REFRESH_COOKIE, { path: "/" });
}

export async function getAccessToken(
  cookies: AstroCookies,
): Promise<string | null> {
  const access = cookies.get(ACCESS_COOKIE)?.value;
  if (access) return access;

  const refresh = cookies.get(REFRESH_COOKIE)?.value;
  if (!refresh) return null;

  try {
    const tokens = await refreshTokens(refresh);
    storeTokens(cookies, tokens);
    return tokens.accessToken;
  } catch {
    clearSession(cookies);
    return null;
  }
}
