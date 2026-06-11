import type { APIRoute } from "astro";
import { clearSession } from "../../../lib/session";

export const prerender = false;

export const POST: APIRoute = ({ cookies }) => {
  clearSession(cookies);
  return new Response(null, { status: 204 });
};
