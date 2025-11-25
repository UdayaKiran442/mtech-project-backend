import { sign } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

// function to create JWT token with 30 days expiration
export function generateJwtToken(payload: { userId: string; role: string }) {
	return sign(payload, JWT_SECRET, {
		expiresIn: "30d",
	});
}
