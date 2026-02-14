import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useGet } from "./useGet";

type WrapperProps = {
	children: ReactNode;
};

type UserSummary = {
	id: number;
	name: string;
};

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

describe("useGet", () => {
	describe("正常系", () => {
		let mockData: UserSummary;
		let queryFn: () => Promise<UserSummary>;

		beforeEach(() => {
			mockData = { id: 1, name: "Test User" };
			queryFn = vi.fn().mockResolvedValue(mockData);
		});

		it("データを正常に取得できること", async () => {
			const { result } = renderHook(() => useGet("/api/users", queryFn), {
				wrapper: createWrapper(),
			});

			expect(result.current.isLoading).toBe(true);
			expect(result.current.data).toBeUndefined();
			expect(result.current.error).toBeNull();

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.data).toEqual(mockData);
			expect(result.current.error).toBeNull();
			expect(queryFn).toHaveBeenCalledTimes(1);
		});

		it("pathをqueryKeyとして使用すること", async () => {
			const path = "/api/test";

			const { result } = renderHook(() => useGet(path, queryFn), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(queryFn).toHaveBeenCalled();
		});
	});

	describe("異常系", () => {
		let mockError: Error;
		let queryFn: () => Promise<never>;

		beforeEach(() => {
			mockError = new Error("Network error");
			queryFn = vi.fn().mockRejectedValue(mockError);
		});

		it("エラーが発生した場合にerrorを返すこと", async () => {
			const { result } = renderHook(() => useGet("/api/users", queryFn), {
				wrapper: createWrapper(),
			});

			expect(result.current.isLoading).toBe(true);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.data).toBeUndefined();
			expect(result.current.error).toEqual(mockError);
		});
	});

	describe("型安全性", () => {
		type User = {
			id: number;
			name: string;
			email: string;
		};

		let mockUser: User;
		let queryFn: () => Promise<User>;

		beforeEach(() => {
			mockUser = {
				id: 1,
				name: "John Doe",
				email: "john@example.com",
			};
			queryFn = vi.fn().mockResolvedValue(mockUser);
		});

		it("ジェネリック型でデータ型を指定できること", async () => {
			const { result } = renderHook(
				() => useGet<User>("/api/users/1", queryFn),
				{
					wrapper: createWrapper(),
				},
			);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.data).toEqual(mockUser);
		});
	});
});
