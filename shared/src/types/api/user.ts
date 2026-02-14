import type { User } from "../model/user";

export interface GetResponse {
	users: User[];
}

export interface DetailResponse {
	user: User;
}

export interface CreateRequest {
	name: string;
	email: string;
}

export interface CreateResponse {
	user: User;
}

export interface UpdateRequest {
	name?: string;
	email?: string;
}

export interface UpdateResponse {
	user: User;
}

export interface DeleteResponse {
	message: string;
}
