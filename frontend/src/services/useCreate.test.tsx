import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { server } from "@/test/msw/server";
import { useCreate } from "./useCreate";

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

describe("useCreate", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("正常系", () => {
		type CreateUserData = { name: string; email: string };
		type CreatedUser = { id: number; name: string; email: string };

		let mockVariables: CreateUserData;
		let mockResponse: CreatedUser;

		beforeEach(() => {
			mockVariables = { name: "Test User", email: "test@example.com" };
			mockResponse = { id: 1, name: "Test User", email: "test@example.com" };

			server.use(
				http.post(USERS_ENDPOINT, () => {
					return HttpResponse.json(mockResponse);
				}),
			);
		});

		it("データを正常に作成できること", async () => {
			const { result } = renderHook(
				() => useCreate<CreatedUser, CreateUserData>(USERS_PATH),
				{
					wrapper: createWrapper(),
				},
			);

			expect(result.current.isPending).toBe(false);

			result.current.mutate(mockVariables);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockResponse);
		});

		it("正しいAPIエンドポイントを呼び出すこと", async () => {
			const path = "posts";
			let requestedUrl = "";

			server.use(
				http.post(`${API_BASE_URL}/posts`, ({ request }) => {
					requestedUrl = request.url;
					return HttpResponse.json(mockResponse);
				}),
			);

			const { result } = renderHook(
				() => useCreate<CreatedUser, CreateUserData>(path),
				{
					wrapper: createWrapper(),
				},
			);

			result.current.mutate(mockVariables);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(requestedUrl).toBe(`${API_BASE_URL}/${path}`);
		});

		describe("invalidateKeysが指定されている場合", () => {
			it("クエリを無効化すること", async () => {
				const queryClient = new QueryClient();
				const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
				const wrapper = createWrapperWithClient(queryClient);

				const { result } = renderHook(
					() =>
						useCreate<CreatedUser, CreateUserData>("users", [
							"users",
							"userList",
						]),
					{
						wrapper,
					},
				);

				result.current.mutate(mockVariables);

				await waitFor(() => {
					expect(result.current.isSuccess).toBe(true);
				});

				expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["users"] });
				expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["userList"] });
			});
		});
	});

	describe("異常系", () => {
		type CreateUserData = { name: string; email: string };
		type CreatedUser = { id: number; name: string; email: string };

		let mockVariables: CreateUserData;

		beforeEach(() => {
			mockVariables = { name: "Test User", email: "test@example.com" };

			server.use(
				http.post(USERS_ENDPOINT, () => {
					return new HttpResponse(null, { status: 400 });
				}),
			);
		});

		it("作成が失敗した場合にエラーを返すこと", async () => {
			const { result } = renderHook(
				() => useCreate<CreatedUser, CreateUserData>(USERS_PATH),
				{
					wrapper: createWrapper(),
				},
			);

			result.current.mutate(mockVariables);

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(result.current.error).toBeInstanceOf(Error);
			expect(result.current.error?.message).toBe("Failed to create users");
		});

		it("ネットワークエラーが発生した場合にエラーを返すこと", async () => {
			server.use(
				http.post(USERS_ENDPOINT, () => {
					return HttpResponse.error();
				}),
			);

			const { result } = renderHook(
				() => useCreate<CreatedUser, CreateUserData>(USERS_PATH),
				{
					wrapper: createWrapper(),
				},
			);

			result.current.mutate(mockVariables);

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(result.current.error).toBeInstanceOf(TypeError);
			expect(result.current.error?.message).toContain("fetch");
		});
	});

	describe("型安全性", () => {
		type CreateUser = {
			name: string;
			email: string;
		};

		type User = {
			id: number;
			name: string;
			email: string;
		};

		let mockVariables: CreateUser;
		let mockUser: User;

		beforeEach(() => {
			mockVariables = {
				name: "Test User",
				email: "test@example.com",
			};
			mockUser = {
				id: 1,
				name: "Test User",
				email: "test@example.com",
			};

			server.use(
				http.post(USERS_ENDPOINT, () => {
					return HttpResponse.json(mockUser);
				}),
			);
		});

		it("ジェネリック型が正しく適用されること", async () => {
			const { result } = renderHook(
				() => useCreate<User, CreateUser>(USERS_PATH),
				{
					wrapper: createWrapper(),
				},
			);

			result.current.mutate(mockVariables);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockUser);
		});
	});
});
