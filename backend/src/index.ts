import { Hono } from "hono";
import { cors } from "hono/cors";

import { user_controller } from "@/controllers/user_controller";

const app = new Hono();

app.use(
	"/*",
	cors({
		origin: "http://localhost:5173",
		credentials: true,
	}),
);

app.route("/users", user_controller);

export default app;
