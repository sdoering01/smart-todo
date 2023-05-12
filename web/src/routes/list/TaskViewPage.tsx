import { useLoaderData, LoaderFunctionArgs } from "react-router-dom";
import TaskView from "../../components/TaskView";

type LoaderData = {
    taskId: number | null;
};

export async function loader({ params }: LoaderFunctionArgs): Promise<LoaderData> {
    return { taskId: params.taskId ? +params.taskId : null };
}

function TaskViewPage() {
    const { taskId } = useLoaderData() as LoaderData;

    return <TaskView taskId={taskId} />;
}

export default TaskViewPage;
