import fs from "node:fs";
import path from "node:path";

import { Miniflare } from "miniflare";

const MIGRATIONS_DIR = path.resolve(__dirname, "../../db/migrations");

export async function createTestD1(): Promise<{
	db: D1Database;
	cleanup: () => Promise<void>;
}> {
	const mf = new Miniflare({
		modules: true,
		script: "export default { fetch() { return new Response('ok'); } }",
		d1Databases: { DB: "test-db" },
	});

	const db = (await mf.getD1Database("DB")) as unknown as D1Database;

	const migrationFiles = fs.readdirSync(MIGRATIONS_DIR).sort();
	for (const file of migrationFiles) {
		const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
		const statements = sql
			.split(";")
			.map((s) => s.trim())
			.filter((s) => s.length > 0);
		for (const statement of statements) {
			await db.prepare(statement).run();
		}
	}

	return { db, cleanup: () => mf.dispose() };
}
