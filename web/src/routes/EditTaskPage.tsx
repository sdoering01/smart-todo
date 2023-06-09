import { LoaderFunctionArgs, Navigate, useLoaderData, useNavigate } from "react-router-dom";

import "./EditTaskPage.css";
import TaskForm from "../components/TaskForm";
import useTasks from "../lib/hooks/useTasks";
import { Task } from "../lib/types";
import { updateTask as apiUpdateTask } from "../lib/api";
import { formatDateISO } from "../lib/date-helpers";
import PageCard from "../components/PageCard";
import PageHeader from "../components/PageHeader";
import useApi from "../lib/hooks/useApi";

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
    const { call, loading, error } = useApi(apiUpdateTask);

    if (taskId == null || tasks.get(taskId) == null) {
        return <Navigate to="/list" replace={true} />;
    }

    const task = tasks.get(taskId)!;

    async function handleTaskEdit(taskWithoutId: Omit<Task, "id">) {
        if (loading) {
            return;
        }

        const dateString = taskWithoutId.date ? formatDateISO(taskWithoutId.date) : "";
        const timeString = taskWithoutId.time ?? "";
        const { error } = await call(taskId!, { ...taskWithoutId, date: dateString, time: timeString });
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
