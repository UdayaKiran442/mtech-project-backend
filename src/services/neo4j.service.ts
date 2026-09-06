import connectToNeo4j from "../config/neo4j.config";
import { ConnectToNeo4jError, FetchFileImportsServiceError, FetchFileNodeDetailsServiceError, QueryNeo4jServiceError } from "../exceptions/neo4j.exceptions";

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

export async function fetchFileImportsService(path: string) {
	try {
		const query = `MATCH (f:File {path: "${path}"})-[:IMPORTS*]-(other:File)
		RETURN other;`;
		const driver = await connectToNeo4j();
		const result = await driver.executeQuery(query);
		return result;
	} catch (error) {
		throw new FetchFileImportsServiceError("Failed to fetch file imports from Neo4j", { cause: (error as Error).message });
	}
}

export async function fetchFileNodeDetailsService(path: string) {
	try {
		const query = `MATCH (f:File {path: "${path}"}) RETURN f;`;
		const driver = await connectToNeo4j();
		const result = await driver.executeQuery(query);
		return result;
	} catch (error) {
		throw new FetchFileNodeDetailsServiceError("Failed to fetch file node details from Neo4j", { cause: (error as Error).message });
	}
}
