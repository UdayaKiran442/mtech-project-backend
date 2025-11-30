import { compare, hash } from "bcrypt-ts";

export async function hashPassword(password: string): Promise<string> {
	const saltRounds = 10;
	return await hash(password, saltRounds);
}

export async function comparePassword(payload: { password: string; hashedPassword: string }) {
	return await compare(payload.password, payload.hashedPassword);
}
