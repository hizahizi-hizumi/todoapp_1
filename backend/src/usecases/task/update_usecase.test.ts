import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createTestD1 } from "@/test/d1";
import { update_usecase } from "./update_usecase";

describe("update_usecase", () => {
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

	it("titleを更新できること", async () => {
		await db
			.prepare(
				'INSERT INTO tasks (id, title, description, status, "order") VALUES (?, ?, ?, ?, ?)',
			)
			.bind("task-1", "Old Title", "desc", "todo", 0)
			.run();

		const task = await update_usecase(db, "task-1", "New Title");

		expect(task.title).toBe("New Title");
		expect(task.description).toBe("desc");
	});

	it("descriptionを更新できること", async () => {
		await db
			.prepare(
				'INSERT INTO tasks (id, title, description, status, "order") VALUES (?, ?, ?, ?, ?)',
			)
			.bind("task-1", "Title", "Old Desc", "todo", 0)
			.run();

		const task = await update_usecase(
			db,
			"task-1",
			undefined,
			"New Description",
		);

		expect(task.title).toBe("Title");
		expect(task.description).toBe("New Description");
	});

	it("titleとdescriptionを同時に更新できること", async () => {
		await db
			.prepare(
				'INSERT INTO tasks (id, title, description, status, "order") VALUES (?, ?, ?, ?, ?)',
			)
			.bind("task-1", "Old", "Old Desc", "todo", 0)
			.run();

		const task = await update_usecase(db, "task-1", "New Title", "New Desc");

		expect(task.title).toBe("New Title");
		expect(task.description).toBe("New Desc");
	});

	it("変更がない場合は現在のタスクを返すこと", async () => {
		await db
			.prepare(
				'INSERT INTO tasks (id, title, description, status, "order") VALUES (?, ?, ?, ?, ?)',
			)
			.bind("task-1", "Title", "Desc", "todo", 0)
			.run();

		const task = await update_usecase(db, "task-1");

		expect(task.title).toBe("Title");
		expect(task.description).toBe("Desc");
	});

	it("空のtitleの場合はエラーをスローすること", async () => {
		await db
			.prepare(
				'INSERT INTO tasks (id, title, description, status, "order") VALUES (?, ?, ?, ?, ?)',
			)
			.bind("task-1", "Title", "", "todo", 0)
			.run();

		await expect(update_usecase(db, "task-1", "")).rejects.toThrow(
			"Title must not be empty",
		);
	});

	it("titleが100文字を超える場合はエラーをスローすること", async () => {
		await db
			.prepare(
				'INSERT INTO tasks (id, title, description, status, "order") VALUES (?, ?, ?, ?, ?)',
			)
			.bind("task-1", "Title", "", "todo", 0)
			.run();

		await expect(update_usecase(db, "task-1", "a".repeat(101))).rejects.toThrow(
			"Title must be 100 characters or less",
		);
	});

	it("descriptionが500文字を超える場合はエラーをスローすること", async () => {
		await db
			.prepare(
				'INSERT INTO tasks (id, title, description, status, "order") VALUES (?, ?, ?, ?, ?)',
			)
			.bind("task-1", "Title", "", "todo", 0)
			.run();

		await expect(
			update_usecase(db, "task-1", undefined, "a".repeat(501)),
		).rejects.toThrow("Description must be 500 characters or less");
	});

	it("存在しないタスクの場合はNotFoundErrorをスローすること", async () => {
		await expect(update_usecase(db, "nonexistent", "Title")).rejects.toThrow(
			"Task not found",
		);
	});
});
