import { HiChevronRight, HiCalendarDays, HiOutlineClock, HiOutlineMapPin } from "react-icons/hi2";
import { Link, Navigate, useNavigate } from "react-router-dom";

import "./TaskView.css";
import useTasks from "../lib/hooks/useTasks";
import { Task } from "../lib/types";
import { formatDate } from "../lib/date-helpers";
import PageCard from "./PageCard";
import PageHeader from "./PageHeader";
import { getRootTasks } from "../lib/graph-tools";
import TaskActionsMenu from "./TaskActionsMenu";

type NextTaskListProps = {
    tasks: Task[];
};

function NextTaskList({ tasks }: NextTaskListProps) {
    return (
        <ul className="next-task-list">
            {tasks.map(task => (
                <li key={task.id} className="next-task-list__item">
                    <Link to={`/list/${task.id}`} className="next-task-list__link">
                        <span className="next-task-list__title">{task.title}</span>
                        <HiChevronRight className="next-task-list__icon" />
                    </Link>
                </li>
            ))}
        </ul>
    );
}

type TaskViewHeaderProps = {
    task?: Task;
}

function TaskViewHeader({ task }: TaskViewHeaderProps) {
    const navigate = useNavigate();

    if (task == null) {
        return <PageHeader startContent={<h1 className="task-view__title">Root Tasks</h1>} />;
    }

    return (
        <PageHeader
            startContent={<h1 className="task-view__title">{task.title}</h1>}
            endContent={
                <TaskActionsMenu task={task} onSuccessfulDelete={() => navigate("/list")} />
            }
            withBackButton
        />
    );
}

type TaskViewProps = {
    taskId: number | null;
};

function TaskView({ taskId }: TaskViewProps) {
    const { tasks } = useTasks();

    if (taskId != null && tasks.get(taskId) == null) {
        return <Navigate to="/list" replace={true} />;
    }

    if (taskId == null) {
        const rootTasks = getRootTasks(tasks);

        return (
            <PageCard header={<TaskViewHeader />}>
                {
                    rootTasks.length > 0
                        ? <NextTaskList tasks={rootTasks} />
                        : (
                            <>
                                <p>No tasks created yet</p>
                                <Link to="/addTask">Add your first task</Link>
                            </>
                        )
                }
            </PageCard>
        );
    }

    const task = tasks.get(taskId);
    // Don't continue rendering and redirect in useEffect
    if (task == null) {
        return null;
    }

    const nextTasks = task.nextTaskIds.map(taskId => tasks.get(taskId)!);

    return (
        <PageCard header={<TaskViewHeader task={task} />}>
            <>
                <p className="task-view__icon-group">
                    <HiCalendarDays className="task-view__body-icon" /> {task.date ? formatDate(task.date) : "-"}
                </p>
                <p className="task-view__icon-group">
                    <HiOutlineClock className="task-view__body-icon" /> {task.time || "-"}
                </p>
                <p className="task-view__icon-group">
                    <HiOutlineMapPin className="task-view__body-icon" /> {task.location || "-"}
                </p>
                {task.description ? <p className="task-view__description">{task.description}</p> : null}
                {
                    nextTasks.length > 0
                        ? (
                            <>
                                <p className="task-view__next-tasks-label">Next tasks</p>
                                <NextTaskList tasks={nextTasks} />
                            </>
                        )
                        : null
                }
            </>
        </PageCard>
    );
}

export default TaskView;
