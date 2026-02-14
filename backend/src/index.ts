import { Hono } from "hono";
import { cors } from "hono/cors";

import { user_controller } from "@/controllers/user_controller";
import { INTERNAL_SERVER_ERROR } from "@/utils/status_code";

type Bindings = {
	DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.onError((err, c) => {
	return c.json({ message: err.message }, INTERNAL_SERVER_ERROR);
});

app.use(
	"/*",
	cors({
		origin: "http://localhost:5173",
		credentials: true,
	}),
);

app.route("/users", user_controller);

export default app;
