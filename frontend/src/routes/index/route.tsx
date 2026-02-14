import { createFileRoute } from "@tanstack/react-router";

import { KanbanBoardPage } from "@/pages/kanban/KanbanBoardPage";

export const Route = createFileRoute("/")({
	component: KanbanBoardPage,
});
