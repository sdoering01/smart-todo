import { ApiCreateTask, ApiUpdateTask } from "./types";

const API_ROOT = import.meta.env.VITE_API_BASE;

type FetchApiOptions = {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: any;
    hasResponse?: boolean;
}

async function fetchApi(relativePath: string, options: FetchApiOptions) {
    const method = options.method ?? "GET";

    const headers: { [key: string]: string } = {};
    if (options.hasResponse) {
        headers["Accept"] = "application/json";
    }
    if (options.body != null) {
        headers["Content-Type"] = "application/json";
    }

    let resp;
    try {
        resp = await fetch(`${API_ROOT}${relativePath}`, {
            method,
            headers,
            body: options.body != null ? JSON.stringify(options.body) : undefined,
        });
    } catch (err) {
        console.error(err);
        throw new Error("Could not reach server");
    }

    if (!resp.ok) {
        let error = null;
        try {
            const errorJson = await resp.json();
            error = errorJson.error;
        } catch (err) {
            console.error(err);
        }

        if (error == null) {
            error = "Server unexpectedly responded with an error code of " + resp.status;
        }

        throw new Error(error);
    }

    if (!options.hasResponse) {
        return null;
    }

    let data;
    try {
        data = await resp.json();
    } catch (err) {
        console.error(err);
        throw new Error("Could not parse server response");
    }

    return data;
}

export async function fetchAllTasks() {
    return fetchApi("/tasks", { hasResponse: true });
}

export async function createTask(task: ApiCreateTask): Promise<{ created: number }> {
    return fetchApi("/tasks", { method: "POST", body: task, hasResponse: true });
}

export async function deleteTask(taskId: number) {
    return fetchApi(`/tasks/${taskId}`, { method: "DELETE" });
}

export async function updateTask(taskId: number, task: ApiUpdateTask) {
    return fetchApi(`/tasks/${taskId}`, { method: "PATCH", body: task });
}
