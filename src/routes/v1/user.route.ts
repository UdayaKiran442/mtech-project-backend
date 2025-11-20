import { Hono } from "hono";
import z from "zod";
import { registerUser } from "../../controller/user.controller";
import { AddUserInDBError, RegisterUserError } from "../../exceptions/user.exceptions";

const userRoute = new Hono();

const RegisterUserSchema = z.object({
	email: z.string(),
	name: z.string(),
	password: z.string(),
	role: z.string(),
});

export type IRegisterUserSchema = z.infer<typeof RegisterUserSchema>;

userRoute.post("/register", async (c) => {
	try {
		const validation = RegisterUserSchema.safeParse(await c.req.json());
		if (!validation.success) {
			throw validation.error;
		}
		const payload = validation.data;
		const newUser = await registerUser(payload);
		return c.json({ success: true, message: "New user successfully registered", newUser });
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

export default userRoute;
