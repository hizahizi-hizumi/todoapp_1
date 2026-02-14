import type { Decorator } from "@storybook/react";
import {
	type AnyRouter,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { useMemo } from "react";

const rootRoute = createRootRoute({
	component: () => <div id="mock-router-outlet" />,
});

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: () => <div>Mock Index</div>,
});

const routeTree = rootRoute.addChildren([indexRoute]);

export const withMockRouter: Decorator = (Story) => {
	const router = useMemo(
		() =>
			createRouter({
				routeTree,
				defaultPreload: "intent",
			}),
		[],
	);

	return (
		<RouterProvider router={router as AnyRouter}>
			<Story />
		</RouterProvider>
	);
};
