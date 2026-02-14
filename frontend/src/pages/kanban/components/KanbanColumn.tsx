import { useDroppable } from "@dnd-kit/core";
import {
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, Flex, Tag } from "antd";
import type { Status, Task } from "shared";

import { TaskCard } from "./TaskCard";

type KanbanColumnProps = {
	status: Status;
	title: string;
	tasks: Task[];
	onTaskClick: (task: Task) => void;
};

export function KanbanColumn({
	status,
	title,
	tasks,
	onTaskClick,
}: KanbanColumnProps) {
	const { setNodeRef } = useDroppable({ id: status });

	return (
		<Card
			title={
				<Flex align="center" gap={8}>
					{title}
					<Tag>{tasks.length}</Tag>
				</Flex>
			}
			style={{ flex: 1, minWidth: 280 }}
			styles={{ body: { padding: 8, minHeight: 200 } }}
		>
			<SortableContext
				items={tasks.map((t) => t.id)}
				strategy={verticalListSortingStrategy}
			>
				<Flex ref={setNodeRef} vertical gap={8} style={{ minHeight: 200 }}>
					{tasks.map((task) => (
						<TaskCard key={task.id} task={task} onClick={onTaskClick} />
					))}
				</Flex>
			</SortableContext>
		</Card>
	);
}
