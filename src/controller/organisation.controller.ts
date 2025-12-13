import { CreateOrganisationError, CreateOrganisationInDBError } from "../exceptions/organisation.exceptions";
import { createOrganisationInDB } from "../repository/organisation.repository";
import type { ICreateOrganisationSchema } from "../routes/v1/organisation.route";

export async function createOrganisation(payload: ICreateOrganisationSchema) {
	try {
		// create organisation
		return await createOrganisationInDB(payload);
	} catch (error) {
		if (error instanceof CreateOrganisationInDBError) {
			throw error;
		}
		throw new CreateOrganisationError("Failed to create organisation", { cause: (error as Error).cause });
	}
}
