import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createTestD1 } from "@/test/d1";
import type { TaskRow } from "./_tasks";
import { move_usecase } from "./move_usecase";

describe("move_usecase", () => {
	let db: D1Database;
	let cleanup: () => Promise<void>;

	beforeAll(async () => {
		const result = await createTestD1();
		db = result.db;
		cleanup = result.cleanup;
	});

	afterAll(async () => {
		await cleanup();
	});

	beforeEach(async () => {
		await db.exec("DELETE FROM tasks");
	});

	it("同一カラム内で移動できること", async () => {
		await db
			.prepare(
				'INSERT INTO tasks (id, title, status, "order") VALUES (?, ?, ?, ?)',
			)
			.bind("task-1", "Task 1", "todo", 0)
			.run();
		await db
			.prepare(
				'INSERT INTO tasks (id, title, status, "order") VALUES (?, ?, ?, ?)',
			)
			.bind("task-2", "Task 2", "todo", 1)
			.run();
		await db
			.prepare(
				'INSERT INTO tasks (id, title, status, "order") VALUES (?, ?, ?, ?)',
			)
			.bind("task-3", "Task 3", "todo", 2)
			.run();

		const moved = await move_usecase(db, "task-1", "todo", 2);

		expect(moved.order).toBe(2);

		const task2 = await db
			.prepare("SELECT * FROM tasks WHERE id = ?")
			.bind("task-2")
			.first<TaskRow>();
		const task3 = await db
			.prepare("SELECT * FROM tasks WHERE id = ?")
			.bind("task-3")
			.first<TaskRow>();

		expect(task2?.order).toBe(0);
		expect(task3?.order).toBe(1);
	});

	it("カラム間で移動できること", async () => {
		await db
			.prepare(
				'INSERT INTO tasks (id, title, status, "order") VALUES (?, ?, ?, ?)',
			)
			.bind("task-1", "Task 1", "todo", 0)
			.run();
		await db
			.prepare(
				'INSERT INTO tasks (id, title, status, "order") VALUES (?, ?, ?, ?)',
			)
			.bind("task-2", "Task 2", "todo", 1)
			.run();
		await db
			.prepare(
				'INSERT INTO tasks (id, title, status, "order") VALUES (?, ?, ?, ?)',
			)
			.bind("task-3", "Task 3", "in_progress", 0)
			.run();

		const moved = await move_usecase(db, "task-1", "in_progress", 0);

		expect(moved.status).toBe("in_progress");
		expect(moved.order).toBe(0);

		const task2 = await db
			.prepare("SELECT * FROM tasks WHERE id = ?")
			.bind("task-2")
			.first<TaskRow>();
		const task3 = await db
			.prepare("SELECT * FROM tasks WHERE id = ?")
			.bind("task-3")
			.first<TaskRow>();

		expect(task2?.order).toBe(0);
		expect(task3?.order).toBe(1);
	});

	it("先頭に移動できること", async () => {
		await db
			.prepare(
				'INSERT INTO tasks (id, title, status, "order") VALUES (?, ?, ?, ?)',
			)
			.bind("task-1", "Task 1", "todo", 0)
			.run();
		await db
			.prepare(
				'INSERT INTO tasks (id, title, status, "order") VALUES (?, ?, ?, ?)',
			)
			.bind("task-2", "Task 2", "todo", 1)
			.run();
		await db
			.prepare(
				'INSERT INTO tasks (id, title, status, "order") VALUES (?, ?, ?, ?)',
			)
			.bind("task-3", "Task 3", "todo", 2)
			.run();

		const moved = await move_usecase(db, "task-3", "todo", 0);

		expect(moved.order).toBe(0);

		const task1 = await db
			.prepare("SELECT * FROM tasks WHERE id = ?")
			.bind("task-1")
			.first<TaskRow>();
		const task2 = await db
			.prepare("SELECT * FROM tasks WHERE id = ?")
			.bind("task-2")
			.first<TaskRow>();

		expect(task1?.order).toBe(1);
		expect(task2?.order).toBe(2);
	});

	it("末尾に移動できること", async () => {
		await db
			.prepare(
				'INSERT INTO tasks (id, title, status, "order") VALUES (?, ?, ?, ?)',
			)
			.bind("task-1", "Task 1", "todo", 0)
			.run();
		await db
			.prepare(
				'INSERT INTO tasks (id, title, status, "order") VALUES (?, ?, ?, ?)',
			)
			.bind("task-2", "Task 2", "todo", 1)
			.run();
		await db
			.prepare(
				'INSERT INTO tasks (id, title, status, "order") VALUES (?, ?, ?, ?)',
			)
			.bind("task-3", "Task 3", "todo", 2)
			.run();

		const moved = await move_usecase(db, "task-1", "todo", 2);

		expect(moved.order).toBe(2);
	});

	it("orderがカラムのタスク数を超える場合は末尾に配置すること", async () => {
		await db
			.prepare(
				'INSERT INTO tasks (id, title, status, "order") VALUES (?, ?, ?, ?)',
			)
			.bind("task-1", "Task 1", "todo", 0)
			.run();
		await db
			.prepare(
				'INSERT INTO tasks (id, title, status, "order") VALUES (?, ?, ?, ?)',
			)
			.bind("task-2", "Task 2", "in_progress", 0)
			.run();

		const moved = await move_usecase(db, "task-1", "in_progress", 100);

		expect(moved.status).toBe("in_progress");
		expect(moved.order).toBe(1);
	});

	it("存在しないタスクの場合はNotFoundErrorをスローすること", async () => {
		await expect(move_usecase(db, "nonexistent", "todo", 0)).rejects.toThrow(
			"Task not found",
		);
	});

	it("無効なstatusの場合はエラーをスローすること", async () => {
		await db
			.prepare(
				'INSERT INTO tasks (id, title, status, "order") VALUES (?, ?, ?, ?)',
			)
			.bind("task-1", "Task 1", "todo", 0)
			.run();

		await expect(
			move_usecase(db, "task-1", "invalid" as "todo", 0),
		).rejects.toThrow("Invalid status");
	});

	it("orderが負の数の場合はエラーをスローすること", async () => {
		await db
			.prepare(
				'INSERT INTO tasks (id, title, status, "order") VALUES (?, ?, ?, ?)',
			)
			.bind("task-1", "Task 1", "todo", 0)
			.run();

		await expect(move_usecase(db, "task-1", "todo", -1)).rejects.toThrow(
			"Order must be a non-negative integer",
		);
	});
});
