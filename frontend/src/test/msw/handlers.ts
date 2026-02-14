import { HttpResponse, http } from "msw";

const apiUrl = "http://localhost:8787";

export const handlers = [
	http.get(`${apiUrl}/users`, () => {
		return HttpResponse.json({ users: [] });
	}),
	http.post(`${apiUrl}/users`, () => {
		return HttpResponse.json({ id: 1 });
	}),
];
