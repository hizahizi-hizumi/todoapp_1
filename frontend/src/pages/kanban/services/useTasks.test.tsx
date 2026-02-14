import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactElement, ReactNode } from "react";
import type { Task } from "shared";
import { beforeEach, describe, expect, it } from "vitest";

import { server } from "@/test/msw/server";
import { useTasks } from "./useTasks";

type WrapperProps = {
	children: ReactNode;
};

const TASKS_API_URL = "http://localhost:8787/tasks";

function createWrapper(): ({ children }: WrapperProps) => ReactElement {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});

	function Wrapper({ children }: WrapperProps): ReactElement {
		return (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
	}

	return Wrapper;
}

function renderUseTasks() {
	return renderHook(() => useTasks(), {
		wrapper: createWrapper(),
	});
}

describe("useTasks", () => {
	describe("正常系", () => {
		let mockTasks: Task[];

		beforeEach(() => {
			mockTasks = [
				{
					id: "task-1",
					title: "Task 1",
					description: "Description 1",
					status: "todo",
					order: 0,
					createdAt: "2026-01-01T00:00:00.000Z",
					updatedAt: "2026-01-01T00:00:00.000Z",
				},
				{
					id: "task-2",
					title: "Task 2",
					description: "Description 2",
					status: "in_progress",
					order: 1,
					createdAt: "2026-01-01T00:00:00.000Z",
					updatedAt: "2026-01-01T00:00:00.000Z",
				},
			];

			server.use(
				http.get(TASKS_API_URL, () => {
					return HttpResponse.json({ tasks: mockTasks });
				}),
			);
		});

		it("タスク一覧を正常に取得できること", async () => {
			const { result } = renderUseTasks();

			expect(result.current.isLoading).toBe(true);
			expect(result.current.tasks).toEqual([]);
			expect(result.current.error).toBeNull();

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.tasks).toEqual(mockTasks);
			expect(result.current.error).toBeNull();
		});

		it("データがundefinedの場合空配列を返すこと", async () => {
			server.use(
				http.get(TASKS_API_URL, () => {
					return HttpResponse.json({});
				}),
			);

			const { result } = renderUseTasks();

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.tasks).toEqual([]);
		});
	});

	describe("異常系", () => {
		beforeEach(() => {
			server.use(
				http.get(TASKS_API_URL, () => {
					return new HttpResponse(null, {
						status: 404,
						statusText: "Not Found",
					});
				}),
			);
		});

		it("fetchが失敗した場合にエラーを返すこと", async () => {
			const { result } = renderUseTasks();

			expect(result.current.isLoading).toBe(true);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.tasks).toEqual([]);
			expect(result.current.error).toBeInstanceOf(Error);
			expect(result.current.error?.message).toContain("Failed to fetch tasks");
		});
	});

	describe("APIエンドポイント", () => {
		let requestedUrl: string;

		beforeEach(() => {
			requestedUrl = "";

			server.use(
				http.get(TASKS_API_URL, ({ request }) => {
					requestedUrl = request.url;
					return HttpResponse.json({ tasks: [] });
				}),
			);
		});

		it("正しいAPIエンドポイントを呼び出すこと", async () => {
			const { result } = renderUseTasks();

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(requestedUrl).toBe(TASKS_API_URL);
		});
	});
});
