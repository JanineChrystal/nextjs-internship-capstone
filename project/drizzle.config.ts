import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;

// Validate that the connection string exists before exporting the config
if (!databaseUrl) {
	throw new Error("DATABASE_URL environment variable is missing.");
}

export default defineConfig({
	out: "./drizzle",
	schema: "./lib/db/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: databaseUrl,
	},
	migrations: {
		schema: "public",
		table: "__drizzle_migrations",
	},
});
