import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactElement, ReactNode } from "react";
import type { GetTasksResponse, MoveTaskResponse, Task } from "shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { server } from "@/test/msw/server";
import { useMoveTask } from "./useMoveTask";

type WrapperProps = {
	children: ReactNode;
};

const API_BASE_URL = "http://localhost:8787";
const TASKS_ENDPOINT = `${API_BASE_URL}/tasks`;

function createWrapperWithClient(
	queryClient: QueryClient,
): ({ children }: WrapperProps) => ReactElement {
	function Wrapper({ children }: WrapperProps): ReactElement {
		return (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
	}

	return Wrapper;
}

function createWrapper(): ({ children }: WrapperProps) => ReactElement {
	const queryClient = new QueryClient({
		defaultOptions: {
			mutations: {
				retry: false,
			},
		},
	});

	return createWrapperWithClient(queryClient);
}

describe("useMoveTask", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("正常系", () => {
		let mockTask: Task;
		let mockResponse: MoveTaskResponse;

		beforeEach(() => {
			mockTask = {
				id: "task-1",
				title: "Task 1",
				description: "Description",
				status: "todo",
				order: 0,
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-01T00:00:00.000Z",
			};

			mockResponse = {
				task: {
					...mockTask,
					status: "in_progress",
					order: 1,
				},
			};

			server.use(
				http.patch(`${TASKS_ENDPOINT}/task-1/move`, () => {
					return HttpResponse.json(mockResponse);
				}),
			);
		});

		it("タスクを正常に移動できること", async () => {
			const { result } = renderHook(() => useMoveTask(), {
				wrapper: createWrapper(),
			});

			result.current.mutate({
				id: "task-1",
				data: { status: "in_progress", order: 1 },
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockResponse);
		});

		it("PATCHリクエストを正しいエンドポイントに送信すること", async () => {
			let requestedUrl = "";

			server.use(
				http.patch(`${TASKS_ENDPOINT}/task-1/move`, ({ request }) => {
					requestedUrl = request.url;
					return HttpResponse.json(mockResponse);
				}),
			);

			const { result } = renderHook(() => useMoveTask(), {
				wrapper: createWrapper(),
			});

			result.current.mutate({
				id: "task-1",
				data: { status: "in_progress", order: 1 },
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(requestedUrl).toBe(`${TASKS_ENDPOINT}/task-1/move`);
		});
	});

	describe("楽観的更新", () => {
		let mockTask: Task;

		beforeEach(() => {
			mockTask = {
				id: "task-1",
				title: "Task 1",
				description: "Description",
				status: "todo",
				order: 0,
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-01T00:00:00.000Z",
			};
		});

		it("キャッシュを楽観的に更新すること", async () => {
			const queryClient = new QueryClient();
			const initialData: GetTasksResponse = { tasks: [mockTask] };
			queryClient.setQueryData(["tasks"], initialData);

			server.use(
				http.patch(`${TASKS_ENDPOINT}/task-1/move`, async () => {
					return HttpResponse.json({
						task: { ...mockTask, status: "done", order: 2 },
					});
				}),
			);

			const wrapper = createWrapperWithClient(queryClient);

			const { result } = renderHook(() => useMoveTask(), { wrapper });

			result.current.mutate({
				id: "task-1",
				data: { status: "done", order: 2 },
			});

			await waitFor(() => {
				const cachedData = queryClient.getQueryData<GetTasksResponse>([
					"tasks",
				]);
				expect(cachedData?.tasks[0].status).toBe("done");
				expect(cachedData?.tasks[0].order).toBe(2);
			});
		});

		it("エラー時にキャッシュをロールバックすること", async () => {
			const queryClient = new QueryClient({
				defaultOptions: { mutations: { retry: false } },
			});
			const initialData: GetTasksResponse = { tasks: [mockTask] };
			queryClient.setQueryData(["tasks"], initialData);

			server.use(
				http.patch(`${TASKS_ENDPOINT}/task-1/move`, () => {
					return new HttpResponse(null, { status: 500 });
				}),
			);

			const wrapper = createWrapperWithClient(queryClient);

			const { result } = renderHook(() => useMoveTask(), { wrapper });

			result.current.mutate({
				id: "task-1",
				data: { status: "done", order: 2 },
			});

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			const cachedData = queryClient.getQueryData<GetTasksResponse>(["tasks"]);
			expect(cachedData?.tasks[0].status).toBe("todo");
			expect(cachedData?.tasks[0].order).toBe(0);
		});
	});

	describe("異常系", () => {
		beforeEach(() => {
			server.use(
				http.patch(`${TASKS_ENDPOINT}/task-1/move`, () => {
					return new HttpResponse(null, { status: 400 });
				}),
			);
		});

		it("移動が失敗した場合にエラーを返すこと", async () => {
			const { result } = renderHook(() => useMoveTask(), {
				wrapper: createWrapper(),
			});

			result.current.mutate({
				id: "task-1",
				data: { status: "in_progress", order: 1 },
			});

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(result.current.error).toBeInstanceOf(Error);
			expect(result.current.error?.message).toBe("Failed to move task task-1");
		});
	});
});
