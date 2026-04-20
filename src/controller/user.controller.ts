import { AddUserInDBError, GetUserByEmailFromDBError, GetUserWorkspacesError, InvalidCredentialsError, LoginUserError, RegisterUserError, UpdateUserError, UpdateUserInDBError } from "../exceptions/user.exceptions";
import { GetUserWorkspacesFromDBError } from "../exceptions/workspaceMember.exceptions";
import { addUserInDB, getUserByEmailFromDB, updateUserInDB } from "../repository/user.repository";
import { getUserWorkspacesFromDB } from "../repository/workspaceMembers.repository";
import type { ILoginUserSchema, IRegisterUserSchema } from "../routes/v1/user.route";
import type { IUpdateUserPayload } from "../types/types";
import { comparePassword, hashPassword } from "../utils/bcrypt.utils";
import { generateJwtToken } from "../utils/jwt.utils";

/**
 * 
 * @param payload 
 * @description Register new user
 * - It first hashed the password and the calls the repository function to add user in the database
 * - JWT Token is generated for the new user and returned along with new user details
 * @returns new user and JWT token 
 */
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

/**
 * 
 * @param payload 
 * @description This function is used to login a user
 * - Checks for user, then compares the password and if valid, generates a JWT token and returns it
 * - If invalid credentials, it throws an error
 * @returns JWT token
 */
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

/**
 * 
 * @param userId 
 * @description Get workspaces user is part of
 * - It calls the repository function to get user workspaces from the database and returns it
 * @returns Workspaces user is part of
 */
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

/**
 * 
 * @param payload 
 * @description Update existing user with details provided in the payload
 * - It calls the repository function to update user in the database
 */
export async function updateUser(payload: IUpdateUserPayload) {
	try {
		await updateUserInDB(payload);
	} catch (error) {
		if (error instanceof UpdateUserInDBError) {
			throw error;
		}
		throw new UpdateUserError("Failed to update user", { cause: (error as Error).cause });
	}
}