import { DndContext } from "@dnd-kit/core";
import type { Meta, StoryObj } from "@storybook/react";

import { KanbanColumn } from "./KanbanColumn";

const meta = {
	title: "Kanban/KanbanColumn",
	component: KanbanColumn,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<DndContext>
				<div style={{ width: 320 }}>
					<Story />
				</div>
			</DndContext>
		),
	],
} satisfies Meta<typeof KanbanColumn>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseTasks = [
	{
		id: "1",
		title: "タスク1",
		description: "説明文1",
		status: "todo" as const,
		order: 0,
		createdAt: "2025-01-01T00:00:00Z",
		updatedAt: "2025-01-01T00:00:00Z",
	},
	{
		id: "2",
		title: "タスク2",
		description: "",
		status: "todo" as const,
		order: 1,
		createdAt: "2025-01-01T00:00:00Z",
		updatedAt: "2025-01-01T00:00:00Z",
	},
	{
		id: "3",
		title: "タスク3",
		description: "長い説明文がここに入ります。",
		status: "todo" as const,
		order: 2,
		createdAt: "2025-01-01T00:00:00Z",
		updatedAt: "2025-01-01T00:00:00Z",
	},
];

export const Empty: Story = {
	args: {
		status: "todo",
		title: "Todo",
		tasks: [],
		onTaskClick: () => {},
	},
};

export const WithTasks: Story = {
	args: {
		status: "todo",
		title: "Todo",
		tasks: baseTasks.slice(0, 2),
		onTaskClick: () => {},
	},
};

export const ManyTasks: Story = {
	args: {
		status: "todo",
		title: "Todo",
		tasks: baseTasks,
		onTaskClick: () => {},
	},
};
