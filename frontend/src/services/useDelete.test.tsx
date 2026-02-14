import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { server } from "@/test/msw/server";
import { useDelete } from "./useDelete";

type WrapperProps = {
	children: ReactNode;
};

const API_BASE_URL = "http://localhost:8787";
const USERS_PATH = "users";
const USERS_ENDPOINT = `${API_BASE_URL}/${USERS_PATH}`;

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

describe("useDelete", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("正常系", () => {
		type DeleteResponse = { success: boolean };

		let mockId: string;
		let mockResponse: DeleteResponse;

		beforeEach(() => {
			mockId = "1";
			mockResponse = { success: true };

			server.use(
				http.delete(`${USERS_ENDPOINT}/1`, ({ request }) => {
					expect(request.method).toBe("DELETE");
					return HttpResponse.json(mockResponse);
				}),
			);
		});

		it("データを正常に削除できること", async () => {
			const { result } = renderHook(
				() => useDelete<DeleteResponse>(USERS_PATH),
				{
					wrapper: createWrapper(),
				},
			);

			expect(result.current.isPending).toBe(false);

			result.current.mutate(mockId);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockResponse);
		});

		it("正しいAPIエンドポイントを呼び出すこと", async () => {
			const path = "posts";
			let requestedUrl = "";

			server.use(
				http.delete(`${API_BASE_URL}/posts/1`, ({ request }) => {
					requestedUrl = request.url;
					return HttpResponse.json(mockResponse);
				}),
			);

			const { result } = renderHook(() => useDelete<DeleteResponse>(path), {
				wrapper: createWrapper(),
			});

			result.current.mutate(mockId);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(requestedUrl).toBe(`${API_BASE_URL}/${path}/${mockId}`);
		});

		describe("invalidateKeysが指定されている場合", () => {
			it("クエリを無効化すること", async () => {
				const queryClient = new QueryClient();
				const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
				const wrapper = createWrapperWithClient(queryClient);

				const { result } = renderHook(
					() => useDelete<DeleteResponse>(USERS_PATH, ["users", "userList"]),
					{
						wrapper,
					},
				);

				result.current.mutate(mockId);

				await waitFor(() => {
					expect(result.current.isSuccess).toBe(true);
				});

				expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["users"] });
				expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["userList"] });
			});
		});
	});

	describe("異常系", () => {
		type DeleteResponse = { success: boolean };

		let mockId: string;

		beforeEach(() => {
			mockId = "1";

			server.use(
				http.delete(`${USERS_ENDPOINT}/1`, () => {
					return new HttpResponse(null, { status: 404 });
				}),
			);
		});

		it("削除が失敗した場合にエラーを返すこと", async () => {
			const { result } = renderHook(
				() => useDelete<DeleteResponse>(USERS_PATH),
				{
					wrapper: createWrapper(),
				},
			);

			result.current.mutate(mockId);

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(result.current.error).toBeInstanceOf(Error);
			expect(result.current.error?.message).toBe(
				`Failed to delete users/${mockId}`,
			);
		});

		it("ネットワークエラーが発生した場合にエラーを返すこと", async () => {
			server.use(
				http.delete(`${USERS_ENDPOINT}/1`, () => {
					return HttpResponse.error();
				}),
			);

			const { result } = renderHook(
				() => useDelete<DeleteResponse>(USERS_PATH),
				{
					wrapper: createWrapper(),
				},
			);

			result.current.mutate(mockId);

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(result.current.error).toBeInstanceOf(TypeError);
			expect(result.current.error?.message).toContain("fetch");
		});
	});

	describe("型安全性", () => {
		type DeleteResponse = {
			success: boolean;
			message: string;
		};

		let mockId: string;
		let mockResponse: DeleteResponse;

		beforeEach(() => {
			mockId = "1";
			mockResponse = {
				success: true,
				message: "User deleted successfully",
			};

			server.use(
				http.delete(`${USERS_ENDPOINT}/1`, () => {
					return HttpResponse.json(mockResponse);
				}),
			);
		});

		it("ジェネリック型が正しく適用されること", async () => {
			const { result } = renderHook(
				() => useDelete<DeleteResponse>(USERS_PATH),
				{
					wrapper: createWrapper(),
				},
			);

			result.current.mutate(mockId);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockResponse);
		});
	});
});
