import { type Context, Hono } from "hono";
import type {
	UserCreateRequest,
	UserCreateResponse,
	UserDeleteResponse,
	UserDetailResponse,
	UserGetResponse,
	UserUpdateRequest,
	UserUpdateResponse,
} from "shared";

import { create_usecase } from "@/usecases/user/create_usecase";
import { delete_usecase } from "@/usecases/user/delete_usecase";
import { detail_usecase } from "@/usecases/user/detail_usecase";
import { get_usecase } from "@/usecases/user/get_usecase";
import { update_usecase } from "@/usecases/user/update_usecase";
import {
	BAD_REQUEST,
	INTERNAL_SERVER_ERROR,
	NOT_FOUND,
} from "@/utils/status_code";

export const user_controller = new Hono();

user_controller
	.get("/", (c: Context) => {
		try {
			const users = get_usecase();

			const response: UserGetResponse = {
				users: users,
			};

			return c.json(response);
		} catch (error) {
			return c.json({ message: (error as Error).message });
		}
	})
	.get("/:id", (c: Context) => {
		const id = Number(c.req.param("id"));

		if (Number.isNaN(id)) {
			return c.json({ message: "Invalid user id" }, BAD_REQUEST);
		}

		try {
			const user = detail_usecase(id);

			const response: UserDetailResponse = {
				user: user,
			};

			return c.json(response);
		} catch (error) {
			if (error instanceof Error && error.name === "NotFoundError") {
				return c.json({ message: error.message }, NOT_FOUND);
			}

			return c.json(
				{ message: (error as Error).message },
				INTERNAL_SERVER_ERROR,
			);
		}
	})
	.post("/", async (c: Context) => {
		try {
			const body = (await c.req.json()) as UserCreateRequest;

			if (!body.name || !body.email) {
				return c.json({ message: "Name and email are required" }, BAD_REQUEST);
			}

			const user = create_usecase(body.name, body.email);

			const response: UserCreateResponse = {
				user: user,
			};

			return c.json(response, 201);
		} catch (error) {
			return c.json(
				{ message: (error as Error).message },
				INTERNAL_SERVER_ERROR,
			);
		}
	})
	.put("/:id", async (c: Context) => {
		const id = Number(c.req.param("id"));

		if (Number.isNaN(id)) {
			return c.json({ message: "Invalid user id" }, BAD_REQUEST);
		}

		try {
			const body = (await c.req.json()) as UserUpdateRequest;

			const user = update_usecase(id, body.name, body.email);

			const response: UserUpdateResponse = {
				user: user,
			};

			return c.json(response);
		} catch (error) {
			if (error instanceof Error && error.name === "NotFoundError") {
				return c.json({ message: error.message }, NOT_FOUND);
			}

			return c.json(
				{ message: (error as Error).message },
				INTERNAL_SERVER_ERROR,
			);
		}
	})
	.delete("/:id", (c: Context) => {
		const id = Number(c.req.param("id"));

		if (Number.isNaN(id)) {
			return c.json({ message: "Invalid user id" }, BAD_REQUEST);
		}

		try {
			delete_usecase(id);

			const response: UserDeleteResponse = {
				message: "User deleted successfully",
			};

			return c.json(response);
		} catch (error) {
			if (error instanceof Error && error.name === "NotFoundError") {
				return c.json({ message: error.message }, NOT_FOUND);
			}

			return c.json(
				{ message: (error as Error).message },
				INTERNAL_SERVER_ERROR,
			);
		}
	});
