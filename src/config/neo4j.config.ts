import neo4j from "neo4j-driver";
import { ConnectToNeo4jError } from "../exceptions/neo4j.exceptions";

export default async function connectToNeo4j() {
	try {
		const url = process.env.NEO4J_URI;
		const username = process.env.NEO4J_USERNAME;
		const password = process.env.NEO4J_PASSWORD;

		if (!url || !username || !password) {
			throw new ConnectToNeo4jError("Missing Neo4j connection parameters. Please set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD in environment variables.", {
				cause: "Missing environment variables",
			});
		}

		const driver = neo4j.driver(url, neo4j.auth.basic(username, password));
		await driver.verifyConnectivity();
		return driver;
	} catch (error) {
		if (error instanceof ConnectToNeo4jError) {
			throw error;
		}
		throw new ConnectToNeo4jError("Failed to connect to Neo4j database", { cause: (error as Error).message });
	}
}
