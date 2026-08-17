// TODO: Task 3.2 - Configure PostgreSQL database (Vercel Postgres or Neon)

/*
TODO: Implementation Notes for Interns:

1. Choose database provider:
   - Vercel Postgres (recommended for Vercel deployment)
   - Neon (good alternative)
   - Local PostgreSQL for development

2. Set up environment variables:
   - DATABASE_URL
   - POSTGRES_URL (if using Vercel Postgres)

3. Configure Drizzle connection

5. Add proper error handling
6. Set up connection pooling if needed

Example structure:
import { drizzle } from 'drizzle-orm/vercel-postgres'
import { sql } from '@vercel/postgres'
import * as schema from './schema'

export const db = drizzle(sql, { schema })

export const queries = {
  projects: {
    getAll: async () => { ... },
    getById: async (id: string) => { ... },
    create: async (data: any) => { ... },
    update: async (id: string, data: any) => { ... },
    delete: async (id: string) => { ... },
  },
  // ... other entity queries
}
*/

import { Pool } from "@neondatabase/serverless";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL environment variable is missing or empty.");
}

// connect to the database using the environment variable with Pool for transaction support
//
// The pool is stashed on globalThis in development because Next.js re-evaluates
// this module on every hot reload. Without the guard each reload constructs a
// new Pool that keeps its own WebSocket connections open, and those accumulate
// across a long dev session until queries start queueing behind them.
const globalForDb = globalThis as unknown as { pool?: Pool };

function createPool(): Pool {
	const created = new Pool({
		connectionString: process.env.DATABASE_URL,
		max: 10,
		// Without this, a pool with no free client waits forever, so a handful of
		// dead sockets turns every later query into a request that never returns.
		// Failing after ten seconds surfaces the problem instead of hanging.
		connectionTimeoutMillis: 10_000,
		// Neon's proxy closes idle connections on its own. Retiring them first
		// keeps the pool from handing out a socket the far end has already dropped.
		idleTimeoutMillis: 30_000,
	});

	// node-postgres rethrows an unhandled 'error' event from an idle client, which
	// would take the dev server down. The pool discards the client either way, so
	// logging is the correct response.
	created.on("error", (error: Error) => {
		console.error("Database pool error (client discarded):", error);
	});

	return created;
}

const pool = globalForDb.pool ?? createPool();

if (process.env.NODE_ENV !== "production") {
	globalForDb.pool = pool;
}

// initialize and export the drizzle instance
export const db = drizzle({ client: pool, schema });
