import type { Meta, StoryObj } from "@storybook/react";

import { TaskCard } from "./TaskCard";

const meta = {
	title: "Kanban/TaskCard",
	component: TaskCard,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<div style={{ width: 300 }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof TaskCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseTask = {
	id: "1",
	title: "サンプルタスク",
	description: "",
	status: "todo" as const,
	order: 0,
	createdAt: "2025-01-01T00:00:00Z",
	updatedAt: "2025-01-01T00:00:00Z",
};

export const Default: Story = {
	args: {
		task: baseTask,
		onClick: () => {},
	},
};

export const WithDescription: Story = {
	args: {
		task: {
			...baseTask,
			id: "2",
			description: "このタスクには説明文があります。",
		},
		onClick: () => {},
	},
};

export const LongDescription: Story = {
	args: {
		task: {
			...baseTask,
			id: "3",
			description:
				"これは非常に長い説明文です。複数行にわたる説明文が省略されて表示されることを確認するためのストーリーです。テキストが2行を超える場合、省略記号で切り詰められます。",
		},
		onClick: () => {},
	},
};

export const NoDescription: Story = {
	args: {
		task: {
			...baseTask,
			id: "4",
			title: "説明なしタスク",
			description: "",
		},
		onClick: () => {},
	},
};
