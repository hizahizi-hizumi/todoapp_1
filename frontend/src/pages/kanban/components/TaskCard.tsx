import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, Typography } from "antd";
import type { Task } from "shared";

type TaskCardProps = {
	task: Task;
	onClick: (task: Task) => void;
};

export function TaskCard({ task, onClick }: TaskCardProps) {
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id: task.id });

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition: transition ?? undefined,
		cursor: "grab",
	};

	return (
		// biome-ignore lint/a11y/useSemanticElements: @dnd-kit requires a div wrapper for CSS transforms
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			role="button"
			tabIndex={0}
			onClick={() => onClick(task)}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					onClick(task);
				}
			}}
		>
			<Card size="small" title={task.title} hoverable>
				{task.description && (
					<Typography.Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
						{task.description}
					</Typography.Paragraph>
				)}
			</Card>
		</div>
	);
}
