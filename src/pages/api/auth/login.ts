import type { APIRoute } from "astro";
import { authorizeUrl } from "../../../lib/spotify";
import { STATE_COOKIE } from "../../../lib/session";

export const prerender = false;

export const GET: APIRoute = ({ cookies, url, redirect }) => {
  const state = crypto.randomUUID();
  cookies.set(STATE_COOKIE, state, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
    maxAge: 60 * 10,
  });
  return redirect(authorizeUrl(url.origin, state), 302);
};
