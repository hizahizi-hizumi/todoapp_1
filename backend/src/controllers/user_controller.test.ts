import { describe, expect, it } from "vitest";

import { user_controller } from "./user_controller";

describe("user_controller", () => {
	describe("GET /", () => {
		it("全ユーザーを200ステータスで返すこと", async () => {
			const res = await user_controller.request("/");

			expect(res.status).toBe(200);

			const json = (await res.json()) as Record<string, unknown>;
			expect(json).toHaveProperty("users");
			expect(json.users).toHaveLength(3);
			expect(json.users).toEqual([
				{ id: 1, name: "Alice", email: "alice@example.com" },
				{ id: 2, name: "Bob", email: "bob@example.com" },
				{ id: 3, name: "Charlie", email: "charlie@example.com" },
			]);
		});

		it("ユーザーの配列を返すこと", async () => {
			const res = await user_controller.request("/");

			const json = (await res.json()) as Record<string, unknown>;
			expect(Array.isArray(json.users)).toBe(true);
		});
	});

	describe("GET /:id", () => {
		describe("有効なIDを指定した場合", () => {
			it("ユーザーを返すこと", async () => {
				const res = await user_controller.request("/1");

				expect(res.status).toBe(200);

				const json = (await res.json()) as Record<string, unknown>;
				expect(json).toHaveProperty("user");
				expect(json.user).toEqual({
					id: 1,
					name: "Alice",
					email: "alice@example.com",
				});
			});

			it("正しいプロパティを持つユーザーを返すこと", async () => {
				const res = await user_controller.request("/2");

				const json = (await res.json()) as Record<string, unknown>;
				expect(json.user).toHaveProperty("id");
				expect(json.user).toHaveProperty("name");
				expect(json.user).toHaveProperty("email");
			});
		});

		describe("無効なID形式を指定した場合", () => {
			it("400を返すこと", async () => {
				const res = await user_controller.request("/invalid");

				expect(res.status).toBe(400);

				const json = (await res.json()) as Record<string, unknown>;
				expect(json).toHaveProperty("message");
				expect(json.message).toBe("Invalid user id");
			});
		});

		describe("数値以外のIDを指定した場合", () => {
			it("400を返すこと", async () => {
				const res = await user_controller.request("/abc");

				expect(res.status).toBe(400);

				const json = (await res.json()) as Record<string, unknown>;
				expect(json.message).toBe("Invalid user id");
			});
		});

		describe("存在しないユーザーを指定した場合", () => {
			it("404を返すこと", async () => {
				const res = await user_controller.request("/999");

				expect(res.status).toBe(404);

				const json = (await res.json()) as Record<string, unknown>;
				expect(json).toHaveProperty("message");
				expect(json.message).toBe("User with id 999 not found");
			});
		});
	});
});
