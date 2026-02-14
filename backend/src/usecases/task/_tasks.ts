import type { Task } from "shared";

export type TaskRow = {
	id: string;
	title: string;
	description: string;
	status: string;
	order: number;
	created_at: string;
	updated_at: string;
};

export function toTask(row: TaskRow): Task {
	return {
		id: row.id,
		title: row.title,
		description: row.description,
		status: row.status as Task["status"],
		order: row.order,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}
