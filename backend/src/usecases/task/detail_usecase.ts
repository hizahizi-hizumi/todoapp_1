import type { Task } from "shared";

import { NotFoundError } from "@/errors/not_found_error";
import { type TaskRow, toTask } from "./_tasks";

export async function detail_usecase(
	db: D1Database,
	id: string,
): Promise<Task> {
	const row = await db
		.prepare("SELECT * FROM tasks WHERE id = ?")
		.bind(id)
		.first<TaskRow>();

	if (!row) {
		throw new NotFoundError("Task not found");
	}

	return toTask(row);
}
