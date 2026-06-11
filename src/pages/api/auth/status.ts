import type { APIRoute } from "astro";
import { getAccessToken } from "../../../lib/session";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const token = await getAccessToken(cookies);
  return Response.json({ authenticated: token !== null });
};
