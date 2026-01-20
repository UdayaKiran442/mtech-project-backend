import { Hono } from "hono";
import z from "zod";

import { getUserWorkspaces, loginUser, registerUser } from "../../controller/user.controller";
import {
	AddUserInDBError,
	GetUserByEmailFromDBError,
	GetUserByIdFromDBError,
	GetUserWorkspacesError,
	InvalidCredentialsError,
	LoginUserError,
	RegisterUserError,
} from "../../exceptions/user.exceptions";
import { authMiddleware } from "../../middleware/authentication.middleware";
import { getUserByIdFromDB } from "../../repository/user.repository";
import { getUserWorkspacesFromDB } from "../../repository/workspaceMembers.repository";
import { GetUserWorkspacesFromDBError } from "../../exceptions/workspaceMember.exceptions";

const userRoute = new Hono();

const RegisterUserSchema = z.object({
	email: z.string(),
	name: z.string(),
	password: z.string(),
});

export type IRegisterUserSchema = z.infer<typeof RegisterUserSchema>;

userRoute.post("/register", async (c) => {
	try {
		const validation = RegisterUserSchema.safeParse(await c.req.json());
		if (!validation.success) {
			throw validation.error;
		}
		const payload = validation.data;
		const response = await registerUser(payload);
		return c.json({ success: true, message: "New user successfully registered", response });
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errMessage = JSON.parse(error.message);
			return c.json({ success: false, error: errMessage[0], message: errMessage[0].message }, 401);
		}

		if (error instanceof AddUserInDBError || error instanceof RegisterUserError) {
			return c.json({ success: false, message: error.message, error: error.cause }, 500);
		}

		return c.json({ success: false, message: "Failed to register new user", error: (error as Error).message }, 500);
	}
});

const LoginUserSchema = z.object({
	email: z.string(),
	password: z.string(),
});

export type ILoginUserSchema = z.infer<typeof LoginUserSchema>;

userRoute.post("/login", async (c) => {
	try {
		const validation = LoginUserSchema.safeParse(await c.req.json());
		if (!validation.success) {
			throw validation.error;
		}
		const payload = validation.data;
		const token = await loginUser(payload);
		return c.json({ success: true, message: "Login successful", token });
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errMessage = JSON.parse(error.message);
			return c.json({ success: false, error: errMessage[0], message: errMessage[0].message }, 401);
		}
		if (error instanceof GetUserByEmailFromDBError || error instanceof LoginUserError || error instanceof InvalidCredentialsError) {
			return c.json({ success: false, message: error.message, error: error.cause }, 500);
		}
		return c.json({ success: false, message: "Failed to register new user", error: (error as Error).message }, 500);
	}
});

userRoute.get("/profile", authMiddleware, async (c) => {
	try {
		const { userId } = c.get("user");
		const [user, workspaces] = await Promise.all([getUserByIdFromDB(userId), getUserWorkspacesFromDB(userId)]);

		return c.json({ success: true, user, workspace: workspaces?.[0] });
	} catch (error) {
		if (error instanceof GetUserByIdFromDBError || error instanceof GetUserWorkspacesFromDBError) {
			return c.json({ success: false, message: error.message, error: error.cause }, 500);
		}
		return c.json({ success: false, message: "Failed to get user profile", error: (error as Error).message }, 500);
	}
});

userRoute.get("/workspaces", authMiddleware, async (c) => {
	try {
		const { userId } = c.get("user");
		const workspaces = await getUserWorkspaces(userId);
		return c.json({ success: true, workspaces });
	} catch (error) {
		if (error instanceof GetUserWorkspacesFromDBError || error instanceof GetUserWorkspacesError) {
			return c.json({ success: false, message: error.message, error: error.cause }, 500);
		}
		return c.json({ success: false, message: "Failed to get user workspaces", error: (error as Error).message }, 500);
	}
});

export default userRoute;
