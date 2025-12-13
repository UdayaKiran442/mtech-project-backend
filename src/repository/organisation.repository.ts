import { CreateOrganisationInDBError } from "../exceptions/organisation.exceptions";
import type { ICreateOrganisationSchema } from "../routes/v1/organisation.route";
import { generateNanoId } from "../utils/nano.utils";
import db from "./db";
import { organisation } from "./schema";

export async function createOrganisationInDB(payload: ICreateOrganisationSchema) {
	try {
		const insertPayload = {
			organisationId: `org_${generateNanoId()}`,
			orgName: payload.orgName,
			orgSize: payload.orgSize,
			industry: payload.industry,
			orgLogoUrl: payload.orgLogoUrl,
			adminId: payload.adminId,
		};
		await db.insert(organisation).values(insertPayload);
		return insertPayload;
	} catch (error) {
		throw new CreateOrganisationInDBError("Failed to create organisation in DB", { cause: (error as Error).cause });
	}
}
