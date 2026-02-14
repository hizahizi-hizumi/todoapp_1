import { describe, expect, it } from "vitest";

function formatMessage(name: string): string {
	return `Hello, ${name}!`;
}

describe("formatMessage", () => {
	it("should format message with name", () => {
		expect(formatMessage("World")).toBe("Hello, World!");
	});

	it("should handle empty string", () => {
		expect(formatMessage("")).toBe("Hello, !");
	});
});
