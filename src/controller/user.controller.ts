import { AddUserInDBError, GetUserByEmailFromDBError, GetUserWorkspacesError, InvalidCredentialsError, LoginUserError, RegisterUserError } from "../exceptions/user.exceptions";
import { GetUserWorkspacesFromDBError } from "../exceptions/workspaceMember.exceptions";
import { addUserInDB, getUserByEmailFromDB } from "../repository/user.repository";
import { getUserWorkspacesFromDB } from "../repository/workspaceMembers.repository";
import type { ILoginUserSchema, IRegisterUserSchema } from "../routes/v1/user.route";
import { comparePassword, hashPassword } from "../utils/bcrypt.utils";
import { generateJwtToken } from "../utils/jwt.utils";

export async function registerUser(payload: IRegisterUserSchema) {
	try {
		const passwordHash = await hashPassword(payload.password);
		const newUser = await addUserInDB({
			email: payload.email,
			name: payload.name,
			passwordHash: passwordHash,
		});
		const jwtToken = generateJwtToken({ userId: newUser.userId });
		return { newUser, jwtToken };
	} catch (error) {
		if (error instanceof AddUserInDBError) {
			throw error;
		}
		throw new RegisterUserError("Failed to register user", { cause: (error as Error).cause });
	}
}

export async function loginUser(payload: ILoginUserSchema) {
	try {
		const user = await getUserByEmailFromDB(payload.email);
		const isValidPassword = await comparePassword({
			hashedPassword: user.passwordHash,
			password: payload.password,
		});
		if (!isValidPassword) {
			// throw error
			throw new InvalidCredentialsError("Invalid password", { cause: "Invalid user email/password" });
		}
		return generateJwtToken({
			userId: user.userId,
		});
	} catch (error) {
		if (error instanceof GetUserByEmailFromDBError) {
			throw error;
		}
		throw new LoginUserError("Failed to login user", { cause: (error as Error).cause });
	}
}

export async function getUserWorkspaces(userId: string){
	try {
		return await getUserWorkspacesFromDB(userId);
	} catch (error) {
		if (error instanceof GetUserWorkspacesFromDBError){
			throw error;
		}
		throw new GetUserWorkspacesError("Failed to get user workspaces", { cause: (error as Error).cause });
	}
}