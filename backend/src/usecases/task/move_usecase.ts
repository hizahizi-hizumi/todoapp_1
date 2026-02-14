import type { Status, Task } from "shared";

import { NotFoundError } from "@/errors/not_found_error";
import { type TaskRow, toTask } from "./_tasks";

const VALID_STATUSES: Status[] = ["todo", "in_progress", "done"];

export async function move_usecase(
	db: D1Database,
	id: string,
	status: Status,
	order: number,
): Promise<Task> {
	if (!VALID_STATUSES.includes(status)) {
		throw new Error("Invalid status");
	}
	if (!Number.isInteger(order) || order < 0) {
		throw new Error("Order must be a non-negative integer");
	}

	const existing = await db
		.prepare("SELECT * FROM tasks WHERE id = ?")
		.bind(id)
		.first<TaskRow>();

	if (!existing) {
		throw new NotFoundError("Task not found");
	}

	const sourceStatus = existing.status;
	const isSameColumn = sourceStatus === status;

	if (isSameColumn) {
		const { results: columnTasks } = await db
			.prepare('SELECT id FROM tasks WHERE status = ? ORDER BY "order" ASC')
			.bind(sourceStatus)
			.all<{ id: string }>();

		const ids = columnTasks.map((r) => r.id).filter((tid) => tid !== id);
		const clampedOrder = Math.min(order, ids.length);
		ids.splice(clampedOrder, 0, id);

		const statements = ids.map((tid, index) =>
			db
				.prepare(
					"UPDATE tasks SET \"order\" = ?, updated_at = datetime('now') WHERE id = ?",
				)
				.bind(index, tid),
		);

		await db.batch(statements);
	} else {
		const { results: sourceTasks } = await db
			.prepare('SELECT id FROM tasks WHERE status = ? ORDER BY "order" ASC')
			.bind(sourceStatus)
			.all<{ id: string }>();

		const sourceIds = sourceTasks.map((r) => r.id).filter((tid) => tid !== id);

		const { results: targetTasks } = await db
			.prepare('SELECT id FROM tasks WHERE status = ? ORDER BY "order" ASC')
			.bind(status)
			.all<{ id: string }>();

		const targetIds = targetTasks.map((r) => r.id);
		const clampedOrder = Math.min(order, targetIds.length);
		targetIds.splice(clampedOrder, 0, id);

		const statements: D1PreparedStatement[] = [];

		statements.push(
			db
				.prepare(
					"UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?",
				)
				.bind(status, id),
		);

		for (let i = 0; i < sourceIds.length; i++) {
			statements.push(
				db
					.prepare(
						"UPDATE tasks SET \"order\" = ?, updated_at = datetime('now') WHERE id = ?",
					)
					.bind(i, sourceIds[i]),
			);
		}

		for (let i = 0; i < targetIds.length; i++) {
			statements.push(
				db
					.prepare(
						"UPDATE tasks SET \"order\" = ?, updated_at = datetime('now') WHERE id = ?",
					)
					.bind(i, targetIds[i]),
			);
		}

		await db.batch(statements);
	}

	const row = await db
		.prepare("SELECT * FROM tasks WHERE id = ?")
		.bind(id)
		.first<TaskRow>();

	if (!row) {
		throw new Error("Failed to retrieve moved task");
	}

	return toTask(row);
}
