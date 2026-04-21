import type { Context } from "hono";
import { getCookie } from "hono/cookie";

export function getCookieValue(c: Context, token: string) {
	return getCookie(c, token);
}
