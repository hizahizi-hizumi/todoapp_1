import { Hono } from "hono";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createTestD1 } from "@/test/d1";
import { task_controller } from "./task_controller";

describe("task_controller", () => {
	let db: D1Database;
	let cleanup: () => Promise<void>;
	let app: Hono;

	beforeAll(async () => {
		const result = await createTestD1();
		db = result.db;
		cleanup = result.cleanup;
	});

	beforeEach(async () => {
		await db.exec("DELETE FROM tasks");
		app = new Hono();
		app.route("/tasks", task_controller);
	});

	afterAll(async () => {
		await cleanup();
	});

	describe("GET /tasks", () => {
		it("タスクが存在しない場合、空の配列を返すこと", async () => {
			const res = await app.request("/tasks", {}, { DB: db });

			expect(res.status).toBe(200);

			const json = (await res.json()) as Record<string, unknown>;
			expect(json.tasks).toEqual([]);
		});

		it("タスクが存在する場合、全タスクを返すこと", async () => {
			await db
				.prepare(
					'INSERT INTO tasks (id, title, description, status, "order") VALUES (?, ?, ?, ?, ?)',
				)
				.bind("id-1", "Task 1", "Desc 1", "todo", 0)
				.run();
			await db
				.prepare(
					'INSERT INTO tasks (id, title, description, status, "order") VALUES (?, ?, ?, ?, ?)',
				)
				.bind("id-2", "Task 2", "Desc 2", "in_progress", 0)
				.run();

			const res = await app.request("/tasks", {}, { DB: db });

			expect(res.status).toBe(200);

			const json = (await res.json()) as Record<string, unknown>;
			expect(json.tasks).toHaveLength(2);
		});
	});

	describe("GET /tasks/:id", () => {
		it("存在するタスクを返すこと", async () => {
			await db
				.prepare(
					'INSERT INTO tasks (id, title, description, status, "order") VALUES (?, ?, ?, ?, ?)',
				)
				.bind("id-1", "Task 1", "Desc 1", "todo", 0)
				.run();

			const res = await app.request("/tasks/id-1", {}, { DB: db });

			expect(res.status).toBe(200);

			const json = (await res.json()) as Record<string, unknown>;
			expect(json).toHaveProperty("task");
		});

		it("存在しないタスクの場合、404を返すこと", async () => {
			const res = await app.request("/tasks/non-existent", {}, { DB: db });

			expect(res.status).toBe(404);

			const json = (await res.json()) as Record<string, unknown>;
			expect(json).toHaveProperty("message");
		});
	});

	describe("POST /tasks", () => {
		it("タスクを作成し201を返すこと", async () => {
			const res = await app.request(
				"/tasks",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ title: "New Task", description: "New Desc" }),
				},
				{ DB: db },
			);

			expect(res.status).toBe(201);

			const json = (await res.json()) as Record<string, unknown>;
			expect(json).toHaveProperty("task");
		});

		it("titleが未指定の場合、400を返すこと", async () => {
			const res = await app.request(
				"/tasks",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ description: "No title" }),
				},
				{ DB: db },
			);

			expect(res.status).toBe(400);

			const json = (await res.json()) as Record<string, unknown>;
			expect(json).toHaveProperty("message");
		});

		it("titleが空白のみの場合、400を返すこと", async () => {
			const res = await app.request(
				"/tasks",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ title: "   " }),
				},
				{ DB: db },
			);

			expect(res.status).toBe(400);

			const json = (await res.json()) as Record<string, unknown>;
			expect(json).toHaveProperty("message");
		});
	});

	describe("PUT /tasks/:id", () => {
		it("タスクを更新し200を返すこと", async () => {
			await db
				.prepare(
					'INSERT INTO tasks (id, title, description, status, "order") VALUES (?, ?, ?, ?, ?)',
				)
				.bind("id-1", "Task 1", "Desc 1", "todo", 0)
				.run();

			const res = await app.request(
				"/tasks/id-1",
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ title: "Updated Task" }),
				},
				{ DB: db },
			);

			expect(res.status).toBe(200);

			const json = (await res.json()) as Record<string, unknown>;
			expect(json).toHaveProperty("task");
		});

		it("存在しないタスクの場合、404を返すこと", async () => {
			const res = await app.request(
				"/tasks/non-existent",
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ title: "Updated" }),
				},
				{ DB: db },
			);

			expect(res.status).toBe(404);

			const json = (await res.json()) as Record<string, unknown>;
			expect(json).toHaveProperty("message");
		});

		it("バリデーションエラーの場合、400を返すこと", async () => {
			await db
				.prepare(
					'INSERT INTO tasks (id, title, description, status, "order") VALUES (?, ?, ?, ?, ?)',
				)
				.bind("id-1", "Task 1", "Desc 1", "todo", 0)
				.run();

			const res = await app.request(
				"/tasks/id-1",
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ title: "" }),
				},
				{ DB: db },
			);

			expect(res.status).toBe(400);

			const json = (await res.json()) as Record<string, unknown>;
			expect(json).toHaveProperty("message");
		});
	});

	describe("DELETE /tasks/:id", () => {
		it("タスクを削除し200を返すこと", async () => {
			await db
				.prepare(
					'INSERT INTO tasks (id, title, description, status, "order") VALUES (?, ?, ?, ?, ?)',
				)
				.bind("id-1", "Task 1", "Desc 1", "todo", 0)
				.run();

			const res = await app.request(
				"/tasks/id-1",
				{ method: "DELETE" },
				{ DB: db },
			);

			expect(res.status).toBe(200);

			const json = (await res.json()) as Record<string, unknown>;
			expect(json).toHaveProperty("message");
		});

		it("存在しないタスクの場合、404を返すこと", async () => {
			const res = await app.request(
				"/tasks/non-existent",
				{ method: "DELETE" },
				{ DB: db },
			);

			expect(res.status).toBe(404);

			const json = (await res.json()) as Record<string, unknown>;
			expect(json).toHaveProperty("message");
		});
	});

	describe("PATCH /tasks/:id/move", () => {
		it("タスクを移動し200を返すこと", async () => {
			await db
				.prepare(
					'INSERT INTO tasks (id, title, description, status, "order") VALUES (?, ?, ?, ?, ?)',
				)
				.bind("id-1", "Task 1", "Desc 1", "todo", 0)
				.run();

			const res = await app.request(
				"/tasks/id-1/move",
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ status: "in_progress", order: 0 }),
				},
				{ DB: db },
			);

			expect(res.status).toBe(200);

			const json = (await res.json()) as Record<string, unknown>;
			expect(json).toHaveProperty("task");
		});

		it("存在しないタスクの場合、404を返すこと", async () => {
			const res = await app.request(
				"/tasks/non-existent/move",
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ status: "in_progress", order: 0 }),
				},
				{ DB: db },
			);

			expect(res.status).toBe(404);

			const json = (await res.json()) as Record<string, unknown>;
			expect(json).toHaveProperty("message");
		});

		it("無効なstatusの場合、400を返すこと", async () => {
			await db
				.prepare(
					'INSERT INTO tasks (id, title, description, status, "order") VALUES (?, ?, ?, ?, ?)',
				)
				.bind("id-1", "Task 1", "Desc 1", "todo", 0)
				.run();

			const res = await app.request(
				"/tasks/id-1/move",
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ status: "invalid_status", order: 0 }),
				},
				{ DB: db },
			);

			expect(res.status).toBe(400);

			const json = (await res.json()) as Record<string, unknown>;
			expect(json).toHaveProperty("message");
		});
	});
});
