import type { Task } from "shared";

import { type TaskRow, toTask } from "./_tasks";

export async function get_usecase(db: D1Database): Promise<Task[]> {
	const { results } = await db
		.prepare('SELECT * FROM tasks ORDER BY status, "order" ASC')
		.all<TaskRow>();

	return results.map(toTask);
}
