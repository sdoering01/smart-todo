import { useRef } from "react";
import { Link } from "react-router-dom";
import { HiEllipsisHorizontal } from "react-icons/hi2";

import "./TaskActionsMenu.css";
import useFetch from "../lib/hooks/useFetch";
import useTasks from "../lib/hooks/useTasks";
import { Task } from "../lib/types";
import { deleteTask as apiDeleteTask } from "../lib/api";

type TaskActionsMenuProps = {
    task: Task;
    openButtonVariant?: "small" | "normal";
    onSuccessfulDelete?: () => void;
    stopClickPropagation?: boolean;
};

function TaskActionsMenu({ task, openButtonVariant, onSuccessfulDelete, stopClickPropagation }: TaskActionsMenuProps) {
    const { deleteTask } = useTasks();

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

        if (onSuccessfulDelete != null) {
            onSuccessfulDelete();
        }
    }

    return (
        <div className="task-actions-menu" ref={actionsContainer} onClick={stopClickPropagation ? (ev) => ev.stopPropagation() : undefined}>
            <button
                className={`task-actions-menu__open-button ${openButtonVariant === "small" ? "task-actions-menu__open-button--small" : ""}`}
                onClick={() => actionsContainer.current!.focus()}
            >
                <HiEllipsisHorizontal className="task-actions-menu__open-icon" />
            </button>
            <menu className="task-actions-menu__actions">
                <li className="task-actions-menu__action"><Link to={`/editTask/${task.id}`} className="task-actions-menu__action-button">Edit</Link></li>
                <li className="task-actions-menu__action"><button onClick={handleDelete} className="task-actions-menu__action-button">Delete</button></li>
            </menu>
        </div>
    );
}

export default TaskActionsMenu;
