import { createFileRoute } from "@tanstack/react-router";

import { IdPage } from "@/pages/users/IdPage";

export const Route = createFileRoute("/users/$id")({
	component: IdPageWrapper,
});

function IdPageWrapper() {
	const { id } = Route.useParams();
	return <IdPage id={id} />;
}
