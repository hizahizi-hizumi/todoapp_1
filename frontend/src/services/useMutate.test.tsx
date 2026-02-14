import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMutate } from "./useMutate";

type WrapperProps = {
	children: ReactNode;
};

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

describe("useMutate", () => {
	describe("正常系", () => {
		type Variables = { name: string };
		type Data = { id: number; name: string };

		let mockVariables: Variables;
		let mockData: Data;
		let mutationFn: (variables: Variables) => Promise<Data>;

		beforeEach(() => {
			mockVariables = { name: "Test" };
			mockData = { id: 1, name: "Test" };
			mutationFn = vi.fn().mockResolvedValue(mockData);
		});

		it("mutationを正常に実行できること", async () => {
			const { result } = renderHook(
				() => useMutate<Data, Variables>(mutationFn),
				{
					wrapper: createWrapper(),
				},
			);

			expect(result.current.isPending).toBe(false);

			result.current.mutate(mockVariables);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockData);
			expect(mutationFn).toHaveBeenCalledWith(
				mockVariables,
				expect.any(Object),
			);
			expect(mutationFn).toHaveBeenCalledTimes(1);
		});

		it("カスタムmutationFnが正しく実行されること", async () => {
			const customMutationFn = vi.fn().mockResolvedValue(mockData);

			const { result } = renderHook(
				() => useMutate<Data, Variables>(customMutationFn),
				{
					wrapper: createWrapper(),
				},
			);

			result.current.mutate(mockVariables);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(customMutationFn).toHaveBeenCalledWith(
				mockVariables,
				expect.any(Object),
			);
		});

		describe("invalidateKeysが指定されている場合", () => {
			it("クエリを無効化すること", async () => {
				const queryClient = new QueryClient();
				const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
				const wrapper = createWrapperWithClient(queryClient);

				const { result } = renderHook(
					() => useMutate<Data, Variables>(mutationFn, ["users", "userList"]),
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

		describe("invalidateKeysが指定されていない場合", () => {
			it("クエリを無効化しないこと", async () => {
				const queryClient = new QueryClient();
				const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
				const wrapper = createWrapperWithClient(queryClient);

				const { result } = renderHook(
					() => useMutate<Data, Variables>(mutationFn),
					{
						wrapper,
					},
				);

				result.current.mutate(mockVariables);

				await waitFor(() => {
					expect(result.current.isSuccess).toBe(true);
				});

				expect(invalidateSpy).not.toHaveBeenCalled();
			});
		});
	});

	describe("異常系", () => {
		type Variables = { name: string };
		type Data = { id: number; name: string };

		let mockVariables: Variables;
		let mockError: Error;
		let mutationFn: (variables: Variables) => Promise<Data>;

		beforeEach(() => {
			mockVariables = { name: "Test" };
			mockError = new Error("Mutation failed");
			mutationFn = vi.fn().mockRejectedValue(mockError);
		});

		it("mutationが失敗した場合にエラーを返すこと", async () => {
			const { result } = renderHook(
				() => useMutate<Data, Variables>(mutationFn),
				{
					wrapper: createWrapper(),
				},
			);

			result.current.mutate(mockVariables);

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(result.current.error).toEqual(mockError);
			expect(result.current.data).toBeUndefined();
		});

		it("エラー発生時にクエリを無効化しないこと", async () => {
			const queryClient = new QueryClient();
			const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
			const wrapper = createWrapperWithClient(queryClient);

			const { result } = renderHook(
				() => useMutate<Data, Variables>(mutationFn, ["users"]),
				{
					wrapper,
				},
			);

			result.current.mutate(mockVariables);

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(invalidateSpy).not.toHaveBeenCalled();
		});
	});

	describe("型安全性", () => {
		type CreateUserVariables = {
			name: string;
			email: string;
		};

		type User = {
			id: number;
			name: string;
			email: string;
		};

		let mockVariables: CreateUserVariables;
		let mockUser: User;
		let mutationFn: (variables: CreateUserVariables) => Promise<User>;

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
			mutationFn = vi.fn().mockResolvedValue(mockUser);
		});

		it("ジェネリック型が正しく適用されること", async () => {
			const { result } = renderHook(
				() => useMutate<User, CreateUserVariables>(mutationFn),
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
