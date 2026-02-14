import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { server } from "@/test/msw/server";
import { useUsers } from "./useUsers";

type WrapperProps = {
	children: ReactNode;
};

type MockUser = {
	id: string;
	name: string;
};

const USERS_API_URL = "http://localhost:8787/users";

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

function renderUseUsers() {
	return renderHook(() => useUsers(), {
		wrapper: createWrapper(),
	});
}

describe("useUsers", () => {
	describe("正常系", () => {
		let mockUsers: MockUser[];

		beforeEach(() => {
			mockUsers = [
				{ id: "1", name: "User 1" },
				{ id: "2", name: "User 2" },
			];

			server.use(
				http.get(USERS_API_URL, () => {
					return HttpResponse.json({ users: mockUsers });
				}),
			);
		});

		it("ユーザー一覧を正常に取得できること", async () => {
			const { result } = renderUseUsers();

			expect(result.current.isLoading).toBe(true);
			expect(result.current.users).toEqual([]);
			expect(result.current.error).toBeNull();

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.users).toEqual(mockUsers);
			expect(result.current.error).toBeNull();
		});

		it("データがundefinedの場合空配列を返すこと", async () => {
			server.use(
				http.get(USERS_API_URL, () => {
					return HttpResponse.json({});
				}),
			);

			const { result } = renderUseUsers();

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.users).toEqual([]);
		});
	});

	describe("異常系", () => {
		beforeEach(() => {
			server.use(
				http.get(USERS_API_URL, () => {
					return new HttpResponse(null, {
						status: 404,
						statusText: "Not Found",
					});
				}),
			);
		});

		it("fetchが失敗した場合にエラーを返すこと", async () => {
			const { result } = renderUseUsers();

			expect(result.current.isLoading).toBe(true);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.users).toEqual([]);
			expect(result.current.error).toBeInstanceOf(Error);
			expect(result.current.error?.message).toContain("Failed to fetch users");
		});
	});

	describe("APIエンドポイント", () => {
		let requestedUrl: string;

		beforeEach(() => {
			requestedUrl = "";

			server.use(
				http.get(USERS_API_URL, ({ request }) => {
					requestedUrl = request.url;
					return HttpResponse.json({ users: [] });
				}),
			);
		});

		it("正しいAPIエンドポイントを呼び出すこと", async () => {
			const { result } = renderUseUsers();

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(requestedUrl).toBe(USERS_API_URL);
		});
	});
});
