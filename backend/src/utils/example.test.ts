import { describe, expect, it } from "vitest";

function add(a: number, b: number): number {
	return a + b;
}

describe("add", () => {
	it("should add two numbers", () => {
		expect(add(1, 2)).toBe(3);
	});

	it("should handle negative numbers", () => {
		expect(add(-1, 1)).toBe(0);
	});
});
