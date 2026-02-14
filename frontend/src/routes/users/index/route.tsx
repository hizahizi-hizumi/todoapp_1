import { createFileRoute } from "@tanstack/react-router";

import { IndexPage } from "@/pages/users/IndexPage";

export const Route = createFileRoute("/users/")({
	component: IndexPage,
});
