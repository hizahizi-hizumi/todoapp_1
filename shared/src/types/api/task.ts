import type { Status, Task } from "../model/task";

export interface GetTasksResponse {
	tasks: Task[];
}

export interface GetTaskDetailResponse {
	task: Task;
}

export interface CreateTaskRequest {
	title: string;
	description?: string;
}

export interface CreateTaskResponse {
	task: Task;
}

export interface UpdateTaskRequest {
	title?: string;
	description?: string;
}

export interface UpdateTaskResponse {
	task: Task;
}

export interface MoveTaskRequest {
	status: Status;
	order: number;
}

export interface MoveTaskResponse {
	task: Task;
}

export interface DeleteTaskResponse {
	message: string;
}
