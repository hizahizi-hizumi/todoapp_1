import { Hono } from "hono";
import type {
	CreateTaskRequest,
	CreateTaskResponse,
	DeleteTaskResponse,
	GetTaskDetailResponse,
	GetTasksResponse,
	MoveTaskRequest,
	MoveTaskResponse,
	UpdateTaskRequest,
	UpdateTaskResponse,
} from "shared";

import { create_usecase } from "@/usecases/task/create_usecase";
import { delete_usecase } from "@/usecases/task/delete_usecase";
import { detail_usecase } from "@/usecases/task/detail_usecase";
import { get_usecase } from "@/usecases/task/get_usecase";
import { move_usecase } from "@/usecases/task/move_usecase";
import { update_usecase } from "@/usecases/task/update_usecase";
import {
	BAD_REQUEST,
	INTERNAL_SERVER_ERROR,
	NOT_FOUND,
} from "@/utils/status_code";

type Bindings = {
	DB: D1Database;
};

export const task_controller = new Hono<{ Bindings: Bindings }>();

task_controller
	.get("/", async (c) => {
		const tasks = await get_usecase(c.env.DB);

		const response: GetTasksResponse = {
			tasks: tasks,
		};

		return c.json(response);
	})
	.get("/:id", async (c) => {
		const id = c.req.param("id");

		try {
			const task = await detail_usecase(c.env.DB, id);

			const response: GetTaskDetailResponse = {
				task: task,
			};

			return c.json(response);
		} catch (error) {
			if (error instanceof Error && error.name === "NotFoundError") {
				return c.json({ message: error.message }, NOT_FOUND);
			}

			return c.json(
				{ message: (error as Error).message },
				INTERNAL_SERVER_ERROR,
			);
		}
	})
	.post("/", async (c) => {
		try {
			const body = (await c.req.json()) as CreateTaskRequest;

			if (!body.title) {
				return c.json({ message: "Title is required" }, BAD_REQUEST);
			}

			const task = await create_usecase(c.env.DB, body.title, body.description);

			const response: CreateTaskResponse = {
				task: task,
			};

			return c.json(response, 201);
		} catch (error) {
			return c.json({ message: (error as Error).message }, BAD_REQUEST);
		}
	})
	.put("/:id", async (c) => {
		const id = c.req.param("id");

		try {
			const body = (await c.req.json()) as UpdateTaskRequest;

			const task = await update_usecase(
				c.env.DB,
				id,
				body.title,
				body.description,
			);

			const response: UpdateTaskResponse = {
				task: task,
			};

			return c.json(response);
		} catch (error) {
			if (error instanceof Error && error.name === "NotFoundError") {
				return c.json({ message: error.message }, NOT_FOUND);
			}

			return c.json({ message: (error as Error).message }, BAD_REQUEST);
		}
	})
	.delete("/:id", async (c) => {
		const id = c.req.param("id");

		try {
			await delete_usecase(c.env.DB, id);

			const response: DeleteTaskResponse = {
				message: "Task deleted successfully",
			};

			return c.json(response);
		} catch (error) {
			if (error instanceof Error && error.name === "NotFoundError") {
				return c.json({ message: error.message }, NOT_FOUND);
			}

			return c.json(
				{ message: (error as Error).message },
				INTERNAL_SERVER_ERROR,
			);
		}
	})
	.patch("/:id/move", async (c) => {
		const id = c.req.param("id");

		try {
			const body = (await c.req.json()) as MoveTaskRequest;

			if (!body.status) {
				return c.json({ message: "Status is required" }, BAD_REQUEST);
			}

			if (body.order === undefined || body.order === null) {
				return c.json({ message: "Order is required" }, BAD_REQUEST);
			}

			const task = await move_usecase(c.env.DB, id, body.status, body.order);

			const response: MoveTaskResponse = {
				task: task,
			};

			return c.json(response);
		} catch (error) {
			if (error instanceof Error && error.name === "NotFoundError") {
				return c.json({ message: error.message }, NOT_FOUND);
			}

			return c.json({ message: (error as Error).message }, BAD_REQUEST);
		}
	});
