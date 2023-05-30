export type ApiLogin = {
    username: string;
    password: string;
}

export type ApiRegister = ApiLogin & {
    email: string;
    fullname: string;
}

export type ApiTask = {
    id: number;
    title: string;
    description?: string;
    date?: string;  // yyyy-mm-dd (https://en.wikipedia.org/wiki/ISO_8601)
    time?: string;  // hh:mm
    location?: string;
    nextTaskIds: number[];
}

// Like ApiTask, but without id (since it's unknown at this point) and with previousTaskIds
export type ApiCreateTask = Omit<ApiTask, "id"> & { previousTaskIds: number[] };

// Like ApiCreateTask, but may include only some of the fields
export type ApiUpdateTask = Partial<ApiCreateTask>;

export type Task = Omit<ApiTask, "date"> & {
    date?: Date;
    previousTaskIds: number[];
};

export type TaskMap = Map<number, Task>;

export function transformApiTasks(apiTasks: ApiTask[]): TaskMap {
    const taskMap: TaskMap = new Map();
    apiTasks.forEach(apiTask => {
        const task = {
            ...apiTask,
            date: apiTask.date ? new Date(apiTask.date) : undefined,
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
