import { hash } from "bcrypt-ts";

export async function hashPassword(password: string): Promise<string> {
	const saltRounds = 10;
	return await hash(password, saltRounds);
}
