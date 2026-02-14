import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createTestD1 } from "@/test/d1";
import { detail_usecase } from "./detail_usecase";

describe("detail_usecase", () => {
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

	it("指定したIDのタスクを返すこと", async () => {
		await db
			.prepare(
				'INSERT INTO tasks (id, title, description, status, "order") VALUES (?, ?, ?, ?, ?)',
			)
			.bind("task-1", "Test Task", "Description", "todo", 0)
			.run();

		const task = await detail_usecase(db, "task-1");

		expect(task.id).toBe("task-1");
		expect(task.title).toBe("Test Task");
		expect(task.description).toBe("Description");
		expect(task.status).toBe("todo");
	});

	it("存在しないIDの場合はNotFoundErrorをスローすること", async () => {
		await expect(detail_usecase(db, "nonexistent")).rejects.toThrow(
			"Task not found",
		);
	});
});
