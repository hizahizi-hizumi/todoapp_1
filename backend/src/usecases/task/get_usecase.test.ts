import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createTestD1 } from "@/test/d1";
import { get_usecase } from "./get_usecase";

describe("get_usecase", () => {
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

	it("タスクが存在しない場合は空配列を返すこと", async () => {
		const tasks = await get_usecase(db);

		expect(tasks).toEqual([]);
	});

	it("全タスクをステータスとorder順で返すこと", async () => {
		await db
			.prepare(
				'INSERT INTO tasks (id, title, status, "order") VALUES (?, ?, ?, ?)',
			)
			.bind("1", "Done Task", "done", 0)
			.run();
		await db
			.prepare(
				'INSERT INTO tasks (id, title, status, "order") VALUES (?, ?, ?, ?)',
			)
			.bind("2", "Todo Task 2", "todo", 1)
			.run();
		await db
			.prepare(
				'INSERT INTO tasks (id, title, status, "order") VALUES (?, ?, ?, ?)',
			)
			.bind("3", "Todo Task 1", "todo", 0)
			.run();
		await db
			.prepare(
				'INSERT INTO tasks (id, title, status, "order") VALUES (?, ?, ?, ?)',
			)
			.bind("4", "In Progress Task", "in_progress", 0)
			.run();

		const tasks = await get_usecase(db);

		expect(tasks).toHaveLength(4);
		expect(tasks[0].title).toBe("Done Task");
		expect(tasks[1].title).toBe("In Progress Task");
		expect(tasks[2].title).toBe("Todo Task 1");
		expect(tasks[3].title).toBe("Todo Task 2");
	});

	it("camelCaseに変換されたTaskオブジェクトを返すこと", async () => {
		await db
			.prepare(
				'INSERT INTO tasks (id, title, status, "order") VALUES (?, ?, ?, ?)',
			)
			.bind("1", "Task 1", "todo", 0)
			.run();

		const tasks = await get_usecase(db);

		expect(tasks[0]).toHaveProperty("createdAt");
		expect(tasks[0]).toHaveProperty("updatedAt");
		expect(tasks[0]).not.toHaveProperty("created_at");
		expect(tasks[0]).not.toHaveProperty("updated_at");
	});
});
