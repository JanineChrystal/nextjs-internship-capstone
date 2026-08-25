import { writeFileSync } from "node:fs";
import { Pool } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

/**
 * Emits DBML for dbdiagram.io from the live schema.
 *
 * Read from the database rather than from schema.ts on purpose: the diagram is
 * meant to document what the deployed branch actually holds, and a generator
 * that parses the source would happily draw a migration nobody applied.
 */
const OUTPUT = "docs/schema.dbml";

interface ColumnRow {
	table: string;
	column: string;
	type: string;
	nullable: string;
	def: string | null;
}

interface KeyRow {
	table: string;
	column: string;
	ref_table: string;
	ref_column: string;
}

function dbmlType(row: ColumnRow): string {
	const base = row.type === "USER-DEFINED" ? "enum" : row.type;
	return base.replace(/ /g, "_");
}

async function main(): Promise<void> {
	const url = process.env.DATABASE_URL;
	if (!url) throw new Error("DATABASE_URL is missing from .env.local.");

	const pool = new Pool({ connectionString: url });

	try {
		const columns = await pool.query<ColumnRow>(`
			SELECT table_name AS table, column_name AS column, data_type AS type,
			       is_nullable AS nullable, column_default AS def
			FROM information_schema.columns
			WHERE table_schema = 'public'
			ORDER BY table_name, ordinal_position
		`);

		const primaries = await pool.query<{ table: string; column: string }>(`
			SELECT tc.table_name AS table, kcu.column_name AS column
			FROM information_schema.table_constraints tc
			JOIN information_schema.key_column_usage kcu
			  ON tc.constraint_name = kcu.constraint_name
			WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
		`);

		const foreigns = await pool.query<KeyRow>(`
			SELECT tc.table_name AS table, kcu.column_name AS column,
			       ccu.table_name AS ref_table, ccu.column_name AS ref_column
			FROM information_schema.table_constraints tc
			JOIN information_schema.key_column_usage kcu
			  ON tc.constraint_name = kcu.constraint_name
			JOIN information_schema.constraint_column_usage ccu
			  ON tc.constraint_name = ccu.constraint_name
			WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
			ORDER BY tc.table_name
		`);

		const pkSet = new Set(
			primaries.rows.map((row) => `${row.table}.${row.column}`),
		);

		const byTable = new Map<string, ColumnRow[]>();
		for (const row of columns.rows) {
			if (row.table === "__drizzle_migrations") continue;
			const list = byTable.get(row.table) ?? [];
			list.push(row);
			byTable.set(row.table, list);
		}

		const lines: string[] = [
			"// Takda PH - generated from the live schema by scripts/generate-dbml.ts",
			"// Paste into https://dbdiagram.io/d",
			"",
		];

		for (const [table, cols] of [...byTable].sort()) {
			lines.push(`Table "${table}" {`);
			for (const col of cols) {
				const attributes: string[] = [];
				if (pkSet.has(`${table}.${col.column}`)) attributes.push("pk");
				if (col.nullable === "NO") attributes.push("not null");
				if (col.def?.includes("gen_random_uuid"))
					attributes.push("default: `gen_random_uuid()`");
				else if (col.def?.includes("now()"))
					attributes.push("default: `now()`");

				const suffix =
					attributes.length > 0 ? ` [${attributes.join(", ")}]` : "";
				lines.push(`  "${col.column}" ${dbmlType(col)}${suffix}`);
			}
			lines.push("}", "");
		}

		lines.push("// Relationships");
		for (const fk of foreigns.rows) {
			if (fk.table === "__drizzle_migrations") continue;
			lines.push(
				`Ref: "${fk.table}"."${fk.column}" > "${fk.ref_table}"."${fk.ref_column}"`,
			);
		}

		writeFileSync(OUTPUT, `${lines.join("\n")}\n`);
		console.info(
			`Wrote ${OUTPUT}: ${byTable.size} tables, ${foreigns.rows.length} relationships.`,
		);
	} finally {
		await pool.end();
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
