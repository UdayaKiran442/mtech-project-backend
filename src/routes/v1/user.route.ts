import { Hono } from "hono";
import z from "zod";

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
		return c.json({ success: true, message: "New user successfully registered", payload });
	} catch (error) {
		return c.json({ success: false, message: "Failed to register new user", error: (error as Error).message }, 500);
	}
});

export default userRoute;
