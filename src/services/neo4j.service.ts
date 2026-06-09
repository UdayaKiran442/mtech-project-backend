import connectToNeo4j from "../config/neo4j.config";
import { ConnectToNeo4jError, UpsertNodeToNeo4jError } from "../exceptions/neo4j.exceptions";

export async function upsertNodeToNeo4jService(query: string) {
	try {
		const driver = await connectToNeo4j();
		if (!driver) {
			throw new Error("Failed to connect to Neo4j database.");
		}
		const session = driver.session();
		await session.run(query);
		await session.close();
		await driver.close();
	} catch (error) {
		if (error instanceof ConnectToNeo4jError) {
			throw error;
		}
		throw new UpsertNodeToNeo4jError("Failed to upsert node to Neo4j database", { cause: (error as Error).message });
	}
}
