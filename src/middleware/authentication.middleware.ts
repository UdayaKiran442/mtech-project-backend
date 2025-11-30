import type { Context, Next } from "hono";

import { verifyJwtToken } from "../utils/jwt.utils";
import type { AuthContext } from "../types/types";

export async function authMiddleware(c: Context<AuthContext>, next: Next) {
	try {
		const token = c.req.header("Authorization");
		if (!token) {
			return c.json({ error: "Unauthorized: Missing or invalid token" }, 401);
		}

		const decoded = verifyJwtToken(token);

		// Attach decoded user info (e.g., userId, role) to context
		c.set("user", decoded);

		await next();
	} catch (error) {
		return c.json({ message: "Unauthorized: Invalid or expired token", error: error }, 401);
	}
}
