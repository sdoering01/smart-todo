import { useNavigate } from "react-router-dom";

import "./AddTaskPage.css";
import TaskForm from "../components/TaskForm";
import useTasks from "../lib/hooks/useTasks";
import { Task } from "../lib/types";
import PageCard from "../components/PageCard";
import PageHeader from "../components/PageHeader";
import { trpc } from "../lib/trpc";

function AddTaskPage() {
    const navigate = useNavigate();
    const { addTask } = useTasks();
    const apiCreateTask = trpc.createTask.useMutation();


    async function handleAddTask(taskWithoutId: Omit<Task, "id">) {
        if (apiCreateTask.isLoading) {
            return;
        }

        apiCreateTask.mutate(taskWithoutId, {
            onSuccess: (createdTask) => {
                const newId = createdTask.id;
                addTask({ ...taskWithoutId, id: newId });
                navigate(-1);
            }
        });
    }

    return (
        <PageCard header={<PageHeader startContent={<h1 className="add-task-page__main-title">Add Task</h1>} withBackButton />}>
            <TaskForm onSubmit={handleAddTask} loading={apiCreateTask.isLoading} error={apiCreateTask.error?.message} actionName="Add" />
        </PageCard>
    );
}

export default AddTaskPage;
