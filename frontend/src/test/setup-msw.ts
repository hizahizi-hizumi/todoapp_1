import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { server } from "./msw/server";

vi.stubEnv("VITE_API_URL", "http://localhost:8787");

beforeAll(() => {
	server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
	server.resetHandlers();
});

afterAll(() => {
	server.close();
});
