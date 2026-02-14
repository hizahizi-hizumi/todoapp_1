import type { Task } from "shared";

import { type TaskRow, toTask } from "./_tasks";

export async function create_usecase(
	db: D1Database,
	title: string,
	description?: string,
): Promise<Task> {
	const trimmedTitle = title.trim();
	if (trimmedTitle.length === 0) {
		throw new Error("Title must not be empty");
	}
	if (trimmedTitle.length > 100) {
		throw new Error("Title must be 100 characters or less");
	}

	const desc = description ?? "";
	if (desc.length > 500) {
		throw new Error("Description must be 500 characters or less");
	}

	const id = crypto.randomUUID();

	const maxOrderRow = await db
		.prepare('SELECT MAX("order") as max_order FROM tasks WHERE status = ?')
		.bind("todo")
		.first<{ max_order: number | null }>();

	const order = maxOrderRow?.max_order != null ? maxOrderRow.max_order + 1 : 0;

	await db
		.prepare(
			'INSERT INTO tasks (id, title, description, status, "order") VALUES (?, ?, ?, ?, ?)',
		)
		.bind(id, trimmedTitle, desc, "todo", order)
		.run();

	const row = await db
		.prepare("SELECT * FROM tasks WHERE id = ?")
		.bind(id)
		.first<TaskRow>();

	if (!row) {
		throw new Error("Failed to retrieve created task");
	}

	return toTask(row);
}
