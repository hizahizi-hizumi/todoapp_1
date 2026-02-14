import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createTestD1 } from "@/test/d1";
import type { TaskRow } from "./_tasks";
import { delete_usecase } from "./delete_usecase";

describe("delete_usecase", () => {
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

	it("タスクを削除できること", async () => {
		await db
			.prepare(
				'INSERT INTO tasks (id, title, status, "order") VALUES (?, ?, ?, ?)',
			)
			.bind("task-1", "Task 1", "todo", 0)
			.run();

		await delete_usecase(db, "task-1");

		const row = await db
			.prepare("SELECT * FROM tasks WHERE id = ?")
			.bind("task-1")
			.first();

		expect(row).toBeNull();
	});

	it("削除後に同一カラムのorderを再計算すること", async () => {
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

		await delete_usecase(db, "task-2");

		const task1 = await db
			.prepare("SELECT * FROM tasks WHERE id = ?")
			.bind("task-1")
			.first<TaskRow>();
		const task3 = await db
			.prepare("SELECT * FROM tasks WHERE id = ?")
			.bind("task-3")
			.first<TaskRow>();

		expect(task1?.order).toBe(0);
		expect(task3?.order).toBe(1);
	});

	it("存在しないタスクの場合はNotFoundErrorをスローすること", async () => {
		await expect(delete_usecase(db, "nonexistent")).rejects.toThrow(
			"Task not found",
		);
	});
});
