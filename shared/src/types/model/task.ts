export type Status = "todo" | "in_progress" | "done";

export interface Task {
	id: string;
	title: string;
	description: string;
	status: Status;
	order: number;
	createdAt: string;
	updatedAt: string;
}
