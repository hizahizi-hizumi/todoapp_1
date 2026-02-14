import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { server } from "@/test/msw/server";
import { useDetail } from "./useDetail";

type WrapperProps = {
	children: ReactNode;
};

const API_BASE_URL = "http://localhost:8787";
const USERS_PATH = "users";
const USERS_ENDPOINT = `${API_BASE_URL}/${USERS_PATH}`;

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

describe("useDetail", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("正常系", () => {
		type User = { id: number; name: string; email: string };

		let mockUser: User;
		let mockId: string;

		beforeEach(() => {
			mockUser = { id: 1, name: "Test User", email: "test@example.com" };
			mockId = "1";

			server.use(
				http.get(`${USERS_ENDPOINT}/1`, ({ request }) => {
					expect(request.method).toBe("GET");
					return HttpResponse.json(mockUser);
				}),
			);
		});

		it("データを正常に取得できること", async () => {
			const { result } = renderHook(() => useDetail<User>(USERS_PATH, mockId), {
				wrapper: createWrapper(),
			});

			expect(result.current.isLoading).toBe(true);
			expect(result.current.data).toBeUndefined();
			expect(result.current.error).toBeNull();

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.data).toEqual(mockUser);
			expect(result.current.error).toBeNull();
		});

		it("正しいAPIエンドポイントを呼び出すこと", async () => {
			const path = "posts";
			let requestedUrl = "";

			server.use(
				http.get(`${API_BASE_URL}/posts/1`, ({ request }) => {
					requestedUrl = request.url;
					return HttpResponse.json(mockUser);
				}),
			);

			const { result } = renderHook(() => useDetail<User>(path, mockId), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(requestedUrl).toBe(`${API_BASE_URL}/${path}/${mockId}`);
		});

		it("pathとidをqueryKeyとして使用すること", async () => {
			const path = "users";
			const id = "123";
			let requestedUrl = "";

			server.use(
				http.get(`${USERS_ENDPOINT}/123`, ({ request }) => {
					requestedUrl = request.url;
					return HttpResponse.json(mockUser);
				}),
			);

			const { result } = renderHook(() => useDetail<User>(path, id), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(requestedUrl).toBe(`${API_BASE_URL}/${path}/${id}`);
		});
	});

	describe("異常系", () => {
		type User = { id: number; name: string; email: string };

		let mockId: string;
		let mockError: Error;

		beforeEach(() => {
			mockId = "1";
			mockError = new Error("Failed to fetch users/1");

			server.use(
				http.get(`${USERS_ENDPOINT}/1`, () => {
					return new HttpResponse(null, { status: 404 });
				}),
			);
		});

		it("取得が失敗した場合にエラーを返すこと", async () => {
			const { result } = renderHook(() => useDetail<User>(USERS_PATH, mockId), {
				wrapper: createWrapper(),
			});

			expect(result.current.isLoading).toBe(true);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.data).toBeUndefined();
			expect(result.current.error).toBeInstanceOf(Error);
			expect(result.current.error?.message).toBe(mockError.message);
		});

		it("ネットワークエラーが発生した場合にエラーを返すこと", async () => {
			server.use(
				http.get(`${USERS_ENDPOINT}/1`, () => {
					return HttpResponse.error();
				}),
			);

			const { result } = renderHook(() => useDetail<User>(USERS_PATH, mockId), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.data).toBeUndefined();
			expect(result.current.error).toBeInstanceOf(TypeError);
			expect(result.current.error?.message).toContain("fetch");
		});
	});

	describe("型安全性", () => {
		type User = {
			id: number;
			name: string;
			email: string;
			role: string;
		};

		let mockUser: User;
		let mockId: string;

		beforeEach(() => {
			mockUser = {
				id: 1,
				name: "Test User",
				email: "test@example.com",
				role: "admin",
			};
			mockId = "1";

			server.use(
				http.get(`${USERS_ENDPOINT}/1`, () => {
					return HttpResponse.json(mockUser);
				}),
			);
		});

		it("ジェネリック型が正しく適用されること", async () => {
			const { result } = renderHook(() => useDetail<User>(USERS_PATH, mockId), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.data).toEqual(mockUser);
		});
	});
});
