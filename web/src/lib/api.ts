import { ApiOptions } from "./hooks/useApi";
import { ApiCreateTask, ApiLogin, ApiRegister, ApiUpdateTask } from "./types";


export function login(credentials: ApiLogin): ApiOptions {
    return { relativePath: "/login", method: "POST", hasResponse: true, body: credentials };
}

export function register(details: ApiRegister): ApiOptions {
    return { relativePath: "/register", method: "POST", hasResponse: true, body: details };
}

export function logout(): ApiOptions {
    return { relativePath: "/logout", method: "GET" };
}

export function fetchAllTasks(): ApiOptions {
    return { relativePath: "/tasks", hasResponse: true };
}

// TODO: Return type was Promise<{ created: number }>
export function createTask(task: ApiCreateTask): ApiOptions {
    return { relativePath: "/tasks", method: "POST", body: task, hasResponse: true };
}

export function deleteTask(taskId: number): ApiOptions {
    return { relativePath: `/tasks/${taskId}`, method: "DELETE" };
}

export function updateTask(taskId: number, task: ApiUpdateTask): ApiOptions {
    return { relativePath: `/tasks/${taskId}`, method: "PATCH", body: task };
}
