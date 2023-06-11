import { createContext, useCallback, useContext, useState } from "react";

import { trpc } from "../trpc";
import { Task, TaskMap, transformApiTasks } from "../types";
import useAuth from "./useAuth";

const TaskContext = createContext<{
    tasks: TaskMap,
    loading: boolean,
    error?: string | null,
    addTask: (newTask: Task) => void,
    deleteTask: (toDelete: Task) => void,
    updateTask: (upatedTask: Task) => void,
    fetchTasks: () => void,
}>({
    tasks: new Map(),
    loading: true,
    error: null,
    addTask: (_newTask: Task) => { },
    deleteTask: (_toDelete: Task) => { },
    updateTask: (_updatedTask: Task) => { },
    fetchTasks: () => { },
});

function insertTaskId(tasks: TaskMap, taskId: number, nextTaskIds: number[], previousTaskIds: number[]) {
    nextTaskIds.forEach(nextTaskId => {
        const toUpdate = tasks.get(nextTaskId)!;
        tasks.set(nextTaskId, {
            ...toUpdate,
            previousTaskIds: [...toUpdate.previousTaskIds, taskId],
        });
    });

    previousTaskIds.forEach(previousTaskId => {
        const toUpdate = tasks.get(previousTaskId)!;
        tasks.set(previousTaskId, {
            ...toUpdate,
            nextTaskIds: [...toUpdate.nextTaskIds, taskId],
        });
    });
}

function removeTaskId(tasks: TaskMap, taskId: number, nextTaskIds: number[], previousTaskIds: number[]) {
    nextTaskIds.forEach(nextTaskId => {
        const toUpdate = tasks.get(nextTaskId)!;
        tasks.set(nextTaskId, {
            ...toUpdate,
            previousTaskIds: toUpdate.previousTaskIds.filter(id => id !== taskId),
        });
    });

    previousTaskIds.forEach(previousTaskId => {
        const toUpdate = tasks.get(previousTaskId)!;
        tasks.set(previousTaskId, {
            ...toUpdate,
            nextTaskIds: toUpdate.nextTaskIds.filter(id => id !== taskId),
        });
    });
}

type TaskProviderProps = React.PropsWithChildren;

export function TaskProvider(props: TaskProviderProps) {
    const { loggedIn } = useAuth();

    const [tasks, setTasks] = useState<TaskMap>(new Map());
    // Necessasry since we need to transform the tasks from the API. That causes the data to only become available in
    // the render *after* the query is done, not in the same one. This would cause all child components to render with
    // an empty task map. To circumvent this problem we defer setting loading to false until the tasks are transformed.
    const [loading, setLoading] = useState(true);

    const taskList = trpc.taskList.useQuery(undefined, {
        enabled: loggedIn,
        onSettled: () => {
            setLoading(false);
        },
        onSuccess: (data) => {
            setTasks(transformApiTasks(data));
        },
    });

    const addTask = useCallback((newTask: Task) => {
        setTasks(prev => {
            const newTasks = new Map(prev);

            insertTaskId(newTasks, newTask.id, newTask.nextTaskIds, newTask.previousTaskIds);

            newTasks.set(newTask.id, newTask);

            return newTasks;
        });
    }, [setTasks]);

    const deleteTask = useCallback((toDelete: Task) => {
        setTasks(prev => {
            const newTasks = new Map(prev);

            removeTaskId(newTasks, toDelete.id, toDelete.nextTaskIds, toDelete.previousTaskIds);

            newTasks.delete(toDelete.id);

            return newTasks;
        });
    }, [setTasks]);

    const updateTask = useCallback((updatedTask: Task) => {
        setTasks(prev => {
            const newTasks = new Map(prev);

            const oldTask = newTasks.get(updatedTask.id)!;

            const deletedPreviousTaskIds = new Set(oldTask.previousTaskIds);
            const newPreviousTaskIds = new Set(updatedTask.previousTaskIds);
            oldTask.previousTaskIds.forEach(id => newPreviousTaskIds.delete(id));
            updatedTask.previousTaskIds.forEach(id => deletedPreviousTaskIds.delete(id));

            const deletedNextTaskIds = new Set(oldTask.nextTaskIds);
            const newNextTaskIds = new Set(updatedTask.nextTaskIds);
            oldTask.nextTaskIds.forEach(id => newNextTaskIds.delete(id));
            updatedTask.nextTaskIds.forEach(id => deletedNextTaskIds.delete(id));

            insertTaskId(newTasks, updatedTask.id, Array.from(newNextTaskIds), Array.from(newPreviousTaskIds));
            removeTaskId(newTasks, updatedTask.id, Array.from(deletedNextTaskIds), Array.from(deletedPreviousTaskIds));

            newTasks.set(updatedTask.id, updatedTask);

            return newTasks;
        });
    }, [setTasks]);

    return (
        <TaskContext.Provider value={{
            tasks,
            loading,
            error: taskList.error?.message,
            addTask,
            deleteTask,
            updateTask,
            fetchTasks: () => {
                setLoading(true);
                taskList.refetch();
            }
        }}>
            {props.children}
        </TaskContext.Provider>
    );
}

export default function useTasks() {
    return useContext(TaskContext);
}
