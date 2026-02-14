import { PlusOutlined } from "@ant-design/icons";
import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { Alert, Button, Flex, Spin, Typography } from "antd";
import { useState } from "react";
import type { Status } from "shared";

import { KanbanColumn } from "./components/KanbanColumn";
import { TaskCard } from "./components/TaskCard";
import { TaskCreateModal } from "./components/TaskCreateModal";
import { TaskEditModal } from "./components/TaskEditModal";
import { useCreateTask } from "./services/useCreateTask";
import { useDeleteTask } from "./services/useDeleteTask";
import { useMoveTask } from "./services/useMoveTask";
import { useTasks } from "./services/useTasks";
import { useUpdateTask } from "./services/useUpdateTask";

const columns: { status: Status; title: string }[] = [
	{ status: "todo", title: "Todo" },
	{ status: "in_progress", title: "In Progress" },
	{ status: "done", title: "Done" },
];

export function KanbanBoardPage() {
	const { tasks, isLoading, error } = useTasks();
	const createMutation = useCreateTask();
	const updateMutation = useUpdateTask();
	const deleteMutation = useDeleteTask();
	const moveMutation = useMoveTask();

	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
	const [activeId, setActiveId] = useState<string | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
	);

	const editingTask = tasks.find((t) => t.id === editingTaskId) ?? null;
	const activeTask = tasks.find((t) => t.id === activeId) ?? null;

	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(String(event.active.id));
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		setActiveId(null);

		if (!over) return;

		const taskId = String(active.id);
		const overId = String(over.id);

		const isOverColumn = columns.some((col) => col.status === overId);

		let targetStatus: Status;
		let targetOrder: number;

		if (isOverColumn) {
			targetStatus = overId as Status;
			targetOrder = tasks.filter((t) => t.status === targetStatus).length;
		} else {
			const overTask = tasks.find((t) => t.id === overId);
			if (!overTask) return;
			targetStatus = overTask.status;
			targetOrder = overTask.order;
		}

		const draggedTask = tasks.find((t) => t.id === taskId);
		if (!draggedTask) return;
		if (
			draggedTask.status === targetStatus &&
			draggedTask.order === targetOrder
		)
			return;

		moveMutation.mutate({
			id: taskId,
			data: { status: targetStatus, order: targetOrder },
		});
	};

	if (isLoading) {
		return (
			<Flex justify="center" align="center" style={{ minHeight: 400 }}>
				<Spin size="large" />
			</Flex>
		);
	}

	if (error) {
		return (
			<Alert
				type="error"
				message="タスクの読み込みに失敗しました"
				description={error.message}
			/>
		);
	}

	return (
		<Flex vertical gap={16}>
			<Flex justify="space-between" align="center">
				<Typography.Title level={3} style={{ margin: 0 }}>
					カンバンボード
				</Typography.Title>
				<Button
					type="primary"
					icon={<PlusOutlined />}
					onClick={() => setIsCreateModalOpen(true)}
				>
					タスクを追加
				</Button>
			</Flex>

			<DndContext
				sensors={sensors}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
			>
				<Flex gap={16}>
					{columns.map((col) => (
						<KanbanColumn
							key={col.status}
							status={col.status}
							title={col.title}
							tasks={tasks
								.filter((t) => t.status === col.status)
								.sort((a, b) => a.order - b.order)}
							onTaskClick={(task) => setEditingTaskId(task.id)}
						/>
					))}
				</Flex>

				<DragOverlay>
					{activeTask ? (
						<TaskCard task={activeTask} onClick={() => {}} />
					) : null}
				</DragOverlay>
			</DndContext>

			<TaskCreateModal
				open={isCreateModalOpen}
				onCancel={() => setIsCreateModalOpen(false)}
				onSubmit={(values) => {
					createMutation.mutate(values, {
						onSuccess: () => setIsCreateModalOpen(false),
					});
				}}
				isLoading={createMutation.isPending}
			/>

			<TaskEditModal
				task={editingTask}
				open={editingTaskId !== null}
				onCancel={() => setEditingTaskId(null)}
				onUpdate={(values) => {
					if (!editingTaskId) return;
					updateMutation.mutate(
						{ id: editingTaskId, data: values },
						{ onSuccess: () => setEditingTaskId(null) },
					);
				}}
				onDelete={() => {
					if (!editingTaskId) return;
					deleteMutation.mutate(editingTaskId, {
						onSuccess: () => setEditingTaskId(null),
					});
				}}
				isUpdateLoading={updateMutation.isPending}
				isDeleteLoading={deleteMutation.isPending}
			/>
		</Flex>
	);
}
