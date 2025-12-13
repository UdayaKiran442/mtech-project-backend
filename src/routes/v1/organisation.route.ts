import { Hono } from "hono";
import z from "zod";

import { authMiddleware } from "../../middleware/authentication.middleware";
import { CreateOrganisationError } from "../../exceptions/organisation.exceptions";
import { createOrganisation } from "../../controller/organisation.controller";

const organisationRoute = new Hono();

const CreateOrganisatonSchema = z.object({
	orgName: z.string(),
	orgSize: z.string(),
	industry: z.string(),
	orgLogoUrl: z.string().nullable(),
});

export type ICreateOrganisationSchema = z.infer<typeof CreateOrganisatonSchema> & { adminId: string };

organisationRoute.post("/create", authMiddleware, async (c) => {
	try {
		const validation = CreateOrganisatonSchema.safeParse(await c.req.json());
		if (!validation.success) {
			throw validation.error;
		}
		const { userId } = c.get("user");
		const payload = {
			...validation.data,
			adminId: userId,
		};
		const newOrganisation = await createOrganisation(payload);
		return c.json({ success: true, message: "Organisation created successfully", organisation: newOrganisation });
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errMessage = JSON.parse(error.message);
			return c.json({ success: false, error: errMessage[0], message: errMessage[0].message }, 401);
		}
		if (error instanceof CreateOrganisationError) {
			return c.json({ success: false, message: "Failed to create organisation", error: error.cause }, 500);
		}
		return c.json({ success: false, message: "Failed to create organisation", error: (error as Error).message }, 500);
	}
});

export default organisationRoute;
