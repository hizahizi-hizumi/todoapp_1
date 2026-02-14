import { describe, expect, it } from "vitest";

import { get_usecase } from "./get_usecase";

describe("get_usecase", () => {
	describe("get_usecase", () => {
		it("全てのユーザーを返すこと", () => {
			const result = get_usecase();

			expect(result).toHaveLength(3);
			expect(result).toEqual([
				{ id: 1, name: "Alice", email: "alice@example.com" },
				{ id: 2, name: "Bob", email: "bob@example.com" },
				{ id: 3, name: "Charlie", email: "charlie@example.com" },
			]);
		});

		it("配列を返すこと", () => {
			const result = get_usecase();

			expect(Array.isArray(result)).toBe(true);
		});

		it("必須プロパティを持つユーザーを返すこと", () => {
			const result = get_usecase();

			for (const user of result) {
				expect(user).toHaveProperty("id");
				expect(user).toHaveProperty("name");
				expect(user).toHaveProperty("email");
			}
		});
	});
});
