import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

	return {
		user: userEvent.setup(),
		...render(ui, { wrapper: Wrapper }),
	};
}

describe("KanbanBoardPage", () => {
	it("空のボードで3カラムが表示されること", async () => {
		server.use(
			http.get(TASKS_API_URL, () => {
				return HttpResponse.json({ tasks: [] });
			}),
		);

		renderWithProviders(<KanbanBoardPage />);

		await waitFor(() => {
			expect(screen.getByText("カンバンボード")).toBeInTheDocument();
		});

		expect(screen.getByText("Todo")).toBeInTheDocument();
		expect(screen.getByText("In Progress")).toBeInTheDocument();
		expect(screen.getByText("Done")).toBeInTheDocument();

		const tags = screen.getAllByText("0");
		expect(tags).toHaveLength(3);
	});

	it("タスクが正しいカラムに表示されること", async () => {
		renderWithProviders(<KanbanBoardPage />);

		await waitFor(() => {
			expect(screen.getByText("Sample Task")).toBeInTheDocument();
		});

		expect(screen.getByText("Todo")).toBeInTheDocument();
	});

	it("作成モーダルでタスクを送信できること", async () => {
		let createCalled = false;
		server.use(
			http.post(TASKS_API_URL, () => {
				createCalled = true;
				return HttpResponse.json(
					{
						task: {
							id: "task-2",
							title: "New Task",
							description: "",
							status: "todo",
							order: 1,
							createdAt: "2026-01-01T00:00:00.000Z",
							updatedAt: "2026-01-01T00:00:00.000Z",
						},
					},
					{ status: 201 },
				);
			}),
		);

		const { user } = renderWithProviders(<KanbanBoardPage />);

		await waitFor(() => {
			expect(screen.getByText("カンバンボード")).toBeInTheDocument();
		});

		await user.click(screen.getByText("タスクを追加"));

		await waitFor(() => {
			expect(screen.getByText("タスクを作成")).toBeInTheDocument();
		});

		await user.type(screen.getByLabelText("タイトル"), "New Task");
		await user.click(screen.getByRole("button", { name: "OK" }));

		await waitFor(() => {
			expect(createCalled).toBe(true);
		});
	});

	it("タスクをクリックして削除できること", async () => {
		let deleteCalled = false;
		server.use(
			http.delete(`${TASKS_API_URL}/:id`, () => {
				deleteCalled = true;
				return HttpResponse.json({ message: "Task deleted successfully" });
			}),
		);

		const { user } = renderWithProviders(<KanbanBoardPage />);

		await waitFor(() => {
			expect(screen.getByText("Sample Task")).toBeInTheDocument();
		});

		// happy-dom環境ではdnd-kitのPointerSensorがポインターイベントを捕捉するためEnterキーで代替
		const taskCard = screen.getByRole("button", { name: /Sample Task/ });
		fireEvent.keyDown(taskCard, { key: "Enter", code: "Enter" });

		await waitFor(
			() => {
				expect(screen.getByText("タスクを編集")).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);

		const dialog = screen.getByRole("dialog");
		// Ant Designがボタンテキストの漢字間にスペースを挿入するため正規表現で検索
		const deleteButton = await within(dialog).findByText(/削\s*除/);
		await user.click(deleteButton);

		const confirmDeleteButton = await screen.findByText(
			"このタスクを削除しますか？",
		);
		expect(confirmDeleteButton).toBeInTheDocument();

		const popconfirmButtons = screen.getAllByRole("button", {
			name: /削\s*除/,
		});
		await user.click(popconfirmButtons[popconfirmButtons.length - 1]);

		await waitFor(() => {
			expect(deleteCalled).toBe(true);
		});
	});
});
