import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/repository/schema.ts",
	dialect: "postgresql",
});
