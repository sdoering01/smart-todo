import { Task as ApiTask }  from "../../../server/src/types";

export type ApiLogin = {
    username: string;
    password: string;
}

export type ApiRegister = ApiLogin & {
    email: string;
    fullname: string;
}

export type { ApiTask }

type RawApiTask = Omit<ApiTask, "date"> & {
    date?: string | null;
}

// Like ApiTask, but without id (since it's unknown at this point) and with previousTaskIds
export type ApiCreateTask = Omit<ApiTask, "id"> & { previousTaskIds: number[] };

export type Task = ApiTask & {
    previousTaskIds: number[];
};

export type TaskMap = Map<number, Task>;

export function transformApiTasks(apiTasks: RawApiTask[]): TaskMap {
    const taskMap: TaskMap = new Map();
    apiTasks.forEach(apiTask => {
        const task = {
            ...apiTask,
            date: apiTask.date ? new Date(apiTask.date) : null,
            previousTaskIds: [],
        };
        taskMap.set(task.id, task);
    });

    // Populate `previousTaskIds` fields of the tasks
    taskMap.forEach(task => {
        task.nextTaskIds.forEach(nextTaskId => taskMap.get(nextTaskId)?.previousTaskIds.push(task.id));
    });

    return taskMap;
}
