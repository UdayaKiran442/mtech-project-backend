import { sign, verify } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

// function to create JWT token with 30 days expiration
export function generateJwtToken(payload: { userId: string }) {
	return sign(payload, JWT_SECRET, {
		expiresIn: "30d",
	});
}

// function to verify JWT token
export function verifyJwtToken(token: string) {
	return verify(token, JWT_SECRET) as { userId: string };
}