import connectToNeo4j from "../config/neo4j.config";
import { ConnectToNeo4jError, QueryNeo4jServiceError } from "../exceptions/neo4j.exceptions";

// biome-ignore lint/suspicious/noExplicitAny: <due to dynamic nature of query parameters, using any type for params>
export async function queryNeo4jService(query: string, params?: Record<string, any>) {
	try {
		const driver = await connectToNeo4j();
		const session = driver.session();
		await session.run(query, params);
		await session.close();
		await driver.close();
	} catch (error) {
        console.error("Error querying Neo4j database:", error);
		if (error instanceof ConnectToNeo4jError) {
			throw error;
		}
		throw new QueryNeo4jServiceError("Failed to query Neo4j database", { cause: (error as Error).message });
	}
}
