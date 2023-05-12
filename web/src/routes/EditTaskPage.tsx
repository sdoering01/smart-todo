import { useEffect } from "react";
import { LoaderFunctionArgs, useLoaderData, useNavigate } from "react-router-dom";

import "./EditTaskPage.css";
import TaskForm from "../components/TaskForm";
import useTasks from "../lib/hooks/useTasks";
import { Task } from "../lib/types";
import { updateTask as apiUpdateTask } from "../lib/api";
import useFetch from "../lib/hooks/useFetch";
import { formatDateISO } from "../lib/date-helpers";
import PageCard from "../components/PageCard";
import PageHeader from "../components/PageHeader";

type LoaderData = {
    taskId: number | null;
};

export async function loader({ params }: LoaderFunctionArgs): Promise<LoaderData> {
    return { taskId: params.taskId ? +params.taskId : null };
}

function EditTaskPage() {
    const { taskId } = useLoaderData() as LoaderData;
    const navigate = useNavigate();
    const { tasks, updateTask } = useTasks();
    const { call, loading, error } = useFetch(apiUpdateTask);

    useEffect(() => {
        if (taskId == null || tasks.get(taskId) == null) {
            navigate("/list", { replace: true });
        }
    }, [taskId]);

    if (taskId == null || tasks.get(taskId) == null) {
        return null;
    }

    const task = tasks.get(taskId)!;

    async function handleTaskEdit(taskWithoutId: Omit<Task, "id">) {
        if (loading) {
            return;
        }

        const dateString = taskWithoutId.date ? formatDateISO(taskWithoutId.date) : undefined;
        const { error } = await call(taskId!, { ...taskWithoutId, date: dateString });
        if (error == null) {
            updateTask({ ...taskWithoutId, id: taskId! });
            navigate(-1);
        }
    }

    return (
        <PageCard header={<PageHeader startContent={<h1 className="edit-task-page__title">Edit Task</h1>} withBackButton />}>
            <TaskForm loading={loading} error={error} onSubmit={handleTaskEdit} actionName="Update" initialTask={task} />
        </PageCard>
    );
}

export default EditTaskPage;
