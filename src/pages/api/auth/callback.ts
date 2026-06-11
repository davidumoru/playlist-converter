import type { APIRoute } from "astro";
import { exchangeCode } from "../../../lib/spotify";
import { STATE_COOKIE, storeTokens } from "../../../lib/session";

export const prerender = false;

export const GET: APIRoute = async ({ cookies, url, redirect }) => {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = cookies.get(STATE_COOKIE)?.value;
  cookies.delete(STATE_COOKIE, { path: "/" });

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirect("/?auth_error=1", 302);
  }

  const tokens = await exchangeCode(url.origin, code);
  storeTokens(cookies, tokens);
  return redirect("/?connected=1", 302);
};
