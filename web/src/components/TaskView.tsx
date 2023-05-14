import { useEffect, useRef } from "react";
import { HiChevronRight, HiEllipsisHorizontal, HiCalendarDays, HiOutlineClock, HiOutlineMapPin } from "react-icons/hi2";
import { Link, useNavigate } from "react-router-dom";

import "./TaskView.css";
import useTasks from "../lib/hooks/useTasks";
import { Task } from "../lib/types";
import { formatDate } from "../lib/date-helpers";
import useFetch from "../lib/hooks/useFetch";
import { deleteTask as apiDeleteTask } from "../lib/api";
import PageCard from "./PageCard";
import PageHeader from "./PageHeader";

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
    const { deleteTask } = useTasks();
    const navigate = useNavigate();
    const { call } = useFetch(apiDeleteTask);

    const actionsContainer = useRef<HTMLDivElement | null>(null);

    async function handleDelete() {
        const { error } = await call(task!.id);
        if (error) {
            console.error(error);
            alert(error);
            return;
        }

        deleteTask(task!);
        navigate("/list");
    }

    if (task == null) {
        return <PageHeader startContent={<h1 className="task-view__title">Root Tasks</h1>} />;
    }


    return (
        <PageHeader
            startContent={<h1 className="task-view__title">{task.title}</h1>}
            endContent={
                <div className="task-view__header-actions" ref={actionsContainer}>
                    <button className="task-view__open-actions-button" onClick={() => actionsContainer.current!.focus()}>
                        <HiEllipsisHorizontal className="task-view__open-actions-icon" />
                    </button>
                    <menu className="task-view__actions-menu">
                        <li className="task-view__action-item"><Link to={`/editTask/${task.id}`} className="task-view__action-button">Edit</Link></li>
                        <li className="task-view__action-item"><button onClick={handleDelete} className="task-view__action-button">Delete</button></li>
                    </menu>
                </div>
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
    const navigate = useNavigate();

    useEffect(() => {
        if (taskId != null && tasks.get(taskId) == null) {
            navigate("/list", { replace: true });
        }
    }, [taskId]);

    if (taskId == null) {
        const rootTasks = Array.from(tasks.values()).filter(task => task.previousTaskIds.length === 0);

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
