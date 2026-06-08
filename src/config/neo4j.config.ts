import neo4j from "neo4j-driver";

export default async function connectToNeo4j() {
	try {
		const url = process.env.NEO4J_URI;
		const username = process.env.NEO4J_USERNAME;
		const password = process.env.NEO4J_PASSWORD;

		const driver = neo4j.driver(url || "", neo4j.auth.basic(username || "", password || ""));
		await driver.verifyConnectivity();
		console.log("Connected to Neo4j database successfully!");
		return driver;
	} catch (error) {
		console.error("Failed to connect to Neo4j database:", error);
	}
}
