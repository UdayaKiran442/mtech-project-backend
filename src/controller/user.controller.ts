import { AddUserInDBError, RegisterUserError } from "../exceptions/user.exceptions";
import { addUserInDB } from "../repository/user.repository";
import type { IRegisterUserSchema } from "../routes/v1/user.route";
import { hashPassword } from "../utils/bcrypt.utils";

export async function registerUser(payload: IRegisterUserSchema) {
	try {
		const passwordHash = await hashPassword(payload.password);
		const newUser = await addUserInDB({
			email: payload.email,
			name: payload.name,
			passwordHash: passwordHash,
			role: payload.role,
		});
		return newUser;
	} catch (error) {
		if (error instanceof AddUserInDBError) {
			throw error;
		}
		throw new RegisterUserError("Failed to register user", { cause: (error as Error).message });
	}
}
