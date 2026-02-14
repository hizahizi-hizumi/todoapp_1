import { NotFoundError } from "@/errors/not_found_error";
import type { TaskRow } from "./_tasks";

export async function delete_usecase(
	db: D1Database,
	id: string,
): Promise<void> {
	const existing = await db
		.prepare("SELECT * FROM tasks WHERE id = ?")
		.bind(id)
		.first<TaskRow>();

	if (!existing) {
		throw new NotFoundError("Task not found");
	}

	await db.prepare("DELETE FROM tasks WHERE id = ?").bind(id).run();

	const { results: remaining } = await db
		.prepare('SELECT id FROM tasks WHERE status = ? ORDER BY "order" ASC')
		.bind(existing.status)
		.all<{ id: string }>();

	if (remaining.length > 0) {
		const statements = remaining.map((row, index) =>
			db
				.prepare('UPDATE tasks SET "order" = ? WHERE id = ?')
				.bind(index, row.id),
		);
		await db.batch(statements);
	}
}
