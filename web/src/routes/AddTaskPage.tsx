import { useNavigate } from "react-router-dom";

import "./AddTaskPage.css";
import TaskForm from "../components/TaskForm";
import useTasks from "../lib/hooks/useTasks";
import { Task } from "../lib/types";
import { createTask } from "../lib/api";
import { formatDateISO } from "../lib/date-helpers";
import PageCard from "../components/PageCard";
import PageHeader from "../components/PageHeader";
import useApi from "../lib/hooks/useApi";

function AddTaskPage() {
    const navigate = useNavigate();
    const { addTask } = useTasks();
    const { call, loading, error } = useApi(createTask);


    async function handleAddTask(taskWithoutId: Omit<Task, "id">) {
        if (loading) {
            return;
        }

        const dateString = taskWithoutId.date ? formatDateISO(taskWithoutId.date) : undefined;
        const { error, data } = await call({ ...taskWithoutId, date: dateString });

        if (error == null) {
            const newId = data!.created;
            addTask({ ...taskWithoutId, id: newId });
            navigate(-1);
        }
    }

    return (
        <PageCard header={<PageHeader startContent={<h1 className="add-task-page__main-title">Add Task</h1>} withBackButton />}>
            <TaskForm onSubmit={handleAddTask} loading={loading} error={error} actionName="Add" />
        </PageCard>
    );
}

export default AddTaskPage;
