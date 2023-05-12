import { ApiCreateTask, ApiUpdateTask } from "./types";

// TODO: Read from environment variable
const API_ROOT = "http://localhost:8080/api";

// TODO: Create reusable function for fetching data from the API

export async function fetchAllTasks() {
    let resp;
    try {
        resp = await fetch(`${API_ROOT}/tasks`, { headers: { accept: "application/json" } });
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

    let data;
    try {
        data = await resp.json();
    } catch (err) {
        console.error(err);
        throw new Error("Could not parse server response");
    }

    return data;
}

export async function createTask(task: ApiCreateTask): Promise<{ created: number }> {
    let resp;
    try {
        resp = await fetch(`${API_ROOT}/tasks`, {
            method: "POST",
            headers: {
                accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(task),
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

    let data;
    try {
        data = await resp.json();
    } catch (err) {
        console.error(err);
        throw new Error("Could not parse server response");
    }

    return data;
}

export async function deleteTask(taskId: number) {
    let resp;
    try {
        resp = await fetch(`${API_ROOT}/tasks/${taskId}`, {
            method: "DELETE",
            headers: { accept: "application/json" },
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

    return null;
}

export async function updateTask(taskId: number, task: ApiUpdateTask) {
    let resp;
    try {
        resp = await fetch(`${API_ROOT}/tasks/${taskId}`, {
            method: "PATCH",
            headers: {
                accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(task),
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

    return null;
}
