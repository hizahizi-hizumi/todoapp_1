import type { Task } from "shared";

import { NotFoundError } from "@/errors/not_found_error";
import { type TaskRow, toTask } from "./_tasks";

export async function update_usecase(
	db: D1Database,
	id: string,
	title?: string,
	description?: string,
): Promise<Task> {
	const existing = await db
		.prepare("SELECT * FROM tasks WHERE id = ?")
		.bind(id)
		.first<TaskRow>();

	if (!existing) {
		throw new NotFoundError("Task not found");
	}

	if (title === undefined && description === undefined) {
		return toTask(existing);
	}

	if (title !== undefined) {
		const trimmedTitle = title.trim();
		if (trimmedTitle.length === 0) {
			throw new Error("Title must not be empty");
		}
		if (trimmedTitle.length > 100) {
			throw new Error("Title must be 100 characters or less");
		}
	}

	if (description !== undefined && description.length > 500) {
		throw new Error("Description must be 500 characters or less");
	}

	const newTitle = title !== undefined ? title.trim() : existing.title;
	const newDescription =
		description !== undefined ? description : existing.description;

	await db
		.prepare(
			"UPDATE tasks SET title = ?, description = ?, updated_at = datetime('now') WHERE id = ?",
		)
		.bind(newTitle, newDescription, id)
		.run();

	const row = await db
		.prepare("SELECT * FROM tasks WHERE id = ?")
		.bind(id)
		.first<TaskRow>();

	if (!row) {
		throw new Error("Failed to retrieve updated task");
	}

	return toTask(row);
}
