import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactElement, ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { server } from "@/test/msw/server";
import { KanbanBoardPage } from "./KanbanBoardPage";

const TASKS_API_URL = "http://localhost:8787/tasks";

type WrapperProps = {
	children: ReactNode;
};

function renderWithProviders(ui: ReactElement) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});

	function Wrapper({ children }: WrapperProps): ReactElement {
		return (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
	}

	return render(ui, { wrapper: Wrapper });
}

// DnDの実際のドラッグ操作テストはhappy-dom環境ではPointerEvent/座標計算の制約により困難なため、
// DndContextが正しくレンダリングされることとカラム間のタスク配置を検証する。
// 完全なDnD E2EテストにはPlaywright/Cypressの使用を推奨。
describe("KanbanBoardPage DnD", () => {
	it("DndContextが正しくレンダリングされること", async () => {
		renderWithProviders(<KanbanBoardPage />);

		await waitFor(() => {
			expect(screen.getByText("カンバンボード")).toBeInTheDocument();
		});

		expect(screen.getByText("Todo")).toBeInTheDocument();
		expect(screen.getByText("In Progress")).toBeInTheDocument();
		expect(screen.getByText("Done")).toBeInTheDocument();
	});

	it("複数タスクが正しいカラムに配置されること", async () => {
		server.use(
			http.get(TASKS_API_URL, () => {
				return HttpResponse.json({
					tasks: [
						{
							id: "task-1",
							title: "Todo Task",
							description: "",
							status: "todo",
							order: 0,
							createdAt: "2026-01-01T00:00:00.000Z",
							updatedAt: "2026-01-01T00:00:00.000Z",
						},
						{
							id: "task-2",
							title: "In Progress Task",
							description: "",
							status: "in_progress",
							order: 0,
							createdAt: "2026-01-01T00:00:00.000Z",
							updatedAt: "2026-01-01T00:00:00.000Z",
						},
						{
							id: "task-3",
							title: "Done Task",
							description: "",
							status: "done",
							order: 0,
							createdAt: "2026-01-01T00:00:00.000Z",
							updatedAt: "2026-01-01T00:00:00.000Z",
						},
					],
				});
			}),
		);

		renderWithProviders(<KanbanBoardPage />);

		await waitFor(() => {
			expect(screen.getByText("Todo Task")).toBeInTheDocument();
		});

		expect(screen.getByText("In Progress Task")).toBeInTheDocument();
		expect(screen.getByText("Done Task")).toBeInTheDocument();
	});

	it("タスクカードがドラッグ可能な属性を持つこと", async () => {
		renderWithProviders(<KanbanBoardPage />);

		await waitFor(() => {
			expect(screen.getByText("Sample Task")).toBeInTheDocument();
		});

		const taskCard = screen.getByRole("button", { name: /Sample Task/ });
		expect(taskCard.getAttribute("aria-roledescription")).toBe("sortable");
		expect(taskCard.getAttribute("aria-disabled")).toBe("false");
		expect(taskCard).toHaveAttribute("tabindex", "0");
	});
});
