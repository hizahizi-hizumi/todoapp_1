import { HttpResponse, http } from "msw";

const apiUrl = "http://localhost:8787";

const sampleTask = {
	id: "task-1",
	title: "Sample Task",
	description: "A sample task",
	status: "todo",
	order: 0,
	createdAt: "2026-01-01T00:00:00.000Z",
	updatedAt: "2026-01-01T00:00:00.000Z",
};

export const handlers = [
	http.get(`${apiUrl}/users`, () => {
		return HttpResponse.json({ users: [] });
	}),
	http.post(`${apiUrl}/users`, () => {
		return HttpResponse.json({ id: 1 });
	}),
	http.get(`${apiUrl}/tasks`, () => {
		return HttpResponse.json({ tasks: [sampleTask] });
	}),
	http.get(`${apiUrl}/tasks/:id`, () => {
		return HttpResponse.json({ task: sampleTask });
	}),
	http.post(`${apiUrl}/tasks`, () => {
		return HttpResponse.json({ task: sampleTask }, { status: 201 });
	}),
	http.put(`${apiUrl}/tasks/:id`, () => {
		return HttpResponse.json({ task: sampleTask });
	}),
	http.delete(`${apiUrl}/tasks/:id`, () => {
		return HttpResponse.json({ message: "Task deleted successfully" });
	}),
	http.patch(`${apiUrl}/tasks/:id/move`, () => {
		return HttpResponse.json({ task: sampleTask });
	}),
];
