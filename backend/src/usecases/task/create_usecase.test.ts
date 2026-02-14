import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createTestD1 } from "@/test/d1";
import { create_usecase } from "./create_usecase";

describe("create_usecase", () => {
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

	it("タスクを作成できること", async () => {
		const task = await create_usecase(db, "New Task", "A description");

		expect(task.title).toBe("New Task");
		expect(task.description).toBe("A description");
		expect(task.status).toBe("todo");
		expect(task.order).toBe(0);
		expect(task.id).toBeDefined();
	});

	it("titleをトリムすること", async () => {
		const task = await create_usecase(db, "  Trimmed Title  ");

		expect(task.title).toBe("Trimmed Title");
	});

	it("descriptionが未指定の場合は空文字になること", async () => {
		const task = await create_usecase(db, "Task");

		expect(task.description).toBe("");
	});

	it("orderが自動インクリメントされること", async () => {
		const task1 = await create_usecase(db, "Task 1");
		const task2 = await create_usecase(db, "Task 2");
		const task3 = await create_usecase(db, "Task 3");

		expect(task1.order).toBe(0);
		expect(task2.order).toBe(1);
		expect(task3.order).toBe(2);
	});

	it("空のtitleの場合はエラーをスローすること", async () => {
		await expect(create_usecase(db, "")).rejects.toThrow(
			"Title must not be empty",
		);
	});

	it("空白のみのtitleの場合はエラーをスローすること", async () => {
		await expect(create_usecase(db, "   ")).rejects.toThrow(
			"Title must not be empty",
		);
	});

	it("titleが100文字を超える場合はエラーをスローすること", async () => {
		const longTitle = "a".repeat(101);

		await expect(create_usecase(db, longTitle)).rejects.toThrow(
			"Title must be 100 characters or less",
		);
	});

	it("descriptionが500文字を超える場合はエラーをスローすること", async () => {
		const longDesc = "a".repeat(501);

		await expect(create_usecase(db, "Task", longDesc)).rejects.toThrow(
			"Description must be 500 characters or less",
		);
	});
});
