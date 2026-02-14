import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
	component: Root,
});

function Root() {
	return (
		<>
			<Outlet />
			<ReactQueryDevtools buttonPosition="bottom-right" />
			<TanStackRouterDevtools position="bottom-right" />
		</>
	);
}
