import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactElement, ReactNode } from "react";
import type { CreateTaskResponse } from "shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { server } from "@/test/msw/server";
import { useCreateTask } from "./useCreateTask";

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

describe("useCreateTask", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("正常系", () => {
		let mockResponse: CreateTaskResponse;

		beforeEach(() => {
			mockResponse = {
				task: {
					id: "task-1",
					title: "New Task",
					description: "A new task",
					status: "todo",
					order: 0,
					createdAt: "2026-01-01T00:00:00.000Z",
					updatedAt: "2026-01-01T00:00:00.000Z",
				},
			};

			server.use(
				http.post(TASKS_ENDPOINT, () => {
					return HttpResponse.json(mockResponse);
				}),
			);
		});

		it("タスクを正常に作成できること", async () => {
			const { result } = renderHook(() => useCreateTask(), {
				wrapper: createWrapper(),
			});

			result.current.mutate({ title: "New Task" });

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockResponse);
		});

		it("成功時にクエリを無効化すること", async () => {
			const queryClient = new QueryClient();
			const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
			const wrapper = createWrapperWithClient(queryClient);

			const { result } = renderHook(() => useCreateTask(), { wrapper });

			result.current.mutate({ title: "New Task" });

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["tasks"] });
		});
	});

	describe("異常系", () => {
		beforeEach(() => {
			server.use(
				http.post(TASKS_ENDPOINT, () => {
					return new HttpResponse(null, { status: 400 });
				}),
			);
		});

		it("作成が失敗した場合にエラーを返すこと", async () => {
			const { result } = renderHook(() => useCreateTask(), {
				wrapper: createWrapper(),
			});

			result.current.mutate({ title: "New Task" });

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(result.current.error).toBeInstanceOf(Error);
			expect(result.current.error?.message).toBe("Failed to create tasks");
		});
	});
});
