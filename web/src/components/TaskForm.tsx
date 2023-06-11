import { Dispatch, FormEvent, SetStateAction, useEffect, useRef, useState } from "react";
import { HiOutlineTrash, HiPencil, HiCalendarDays, HiOutlineClock, HiOutlineMapPin, HiDocumentText } from "react-icons/hi2";

import "./TaskForm.css";
import useTasks from "../lib/hooks/useTasks";
import { Task } from "../lib/types";
import { formatDateISO } from "../lib/date-helpers";
import ErrorAlert from "./ErrorAlert";

type SelectedTaskProps = {
    task: Task;
    onUnselectTask: () => void,
}

function SelectedTask({ task, onUnselectTask }: SelectedTaskProps) {
    return (
        <li className="task-picker__selected-task">
            {task.title}
            <button
                className="task-picker__unselect-button"
                onClick={onUnselectTask}
            >
                <HiOutlineTrash className="task-picker__unselect-icon" />
            </button>
        </li>
    );
}

type TaskPickerProps = {
    thisTaskId?: number | null,
    title: string;
    selectedTaskIds: number[],
    setSelectedTaskIds: Dispatch<SetStateAction<number[]>>,
};

function TaskPicker({ thisTaskId, title, selectedTaskIds, setSelectedTaskIds }: TaskPickerProps) {
    const { tasks } = useTasks();
    const selectRef = useRef<null | HTMLSelectElement>(null);

    function handleSelectTask() {
        setSelectedTaskIds(prev => [...prev, +selectRef.current!.value]);
    }

    function handleUnselectTask(taskId: number) {
        setSelectedTaskIds(prev => prev.filter(id => id !== taskId));
    }

    const selectedTasks = selectedTaskIds.map(taskId => tasks.get(taskId)!);

    const unselectedTaskIds = new Set(tasks.keys());
    if (thisTaskId != null) {
        unselectedTaskIds.delete(thisTaskId);
    }
    selectedTaskIds.forEach(taskId => unselectedTaskIds.delete(taskId));
    const unselectedTasks = Array.from(unselectedTaskIds.values()).map(taskId => tasks.get(taskId)!);

    if (unselectedTasks.length === 0 && selectedTasks.length === 0) {
        return null;
    }

    return (
        <div className="task-form__form-group task-picker">
            <label>{title}</label>
            <div className="task-picker__body">
                <ul className="task-picker__selected-list">
                    {selectedTasks.map(task => <SelectedTask key={task.id} task={task} onUnselectTask={() => handleUnselectTask(task.id)} />)}
                </ul>
                {
                    unselectedTasks.length > 0
                        ? (
                            <div className="task-picker__add-group">
                                <select className="task-picker__select" ref={selectRef}>
                                    {unselectedTasks.map(task => <option key={task.id} value={task.id}>{task.title}</option>)}
                                </select>
                                <button onClick={handleSelectTask} type="button" className="task-picker__add-button">Add</button>
                            </div>
                        )
                        : null
                }
            </div>
        </div>
    );
}

type TaskFormProps = {
    onSubmit: (_taskWithoutId: Omit<Task, "id">) => void,
    loading: boolean,
    error?: string | null,
    actionName?: string;
    initialTask?: Task,
};

function TaskForm({ onSubmit, loading, error, initialTask, actionName }: TaskFormProps) {
    const [previousTaskIds, setPreviousTaskIds] = useState<number[]>([]);
    const [nextTaskIds, setNextTaskIds] = useState<number[]>([]);

    const thisTaskIdRef = useRef<number | null>(null);
    const titleRef = useRef<HTMLInputElement | null>(null);
    const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
    const dateRef = useRef<HTMLInputElement | null>(null);
    const timeRef = useRef<HTMLInputElement | null>(null);
    const locationRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (initialTask != null) {
            thisTaskIdRef.current = initialTask.id;
            titleRef.current!.value = initialTask.title;
            descriptionRef.current!.value = initialTask.description ?? "";
            dateRef.current!.value = initialTask.date ? formatDateISO(initialTask.date) : "";
            timeRef.current!.value = initialTask.time ?? "";
            locationRef.current!.value = initialTask.location ?? "";
            setNextTaskIds(initialTask.nextTaskIds);
            setPreviousTaskIds(initialTask.previousTaskIds);
        }
    }, []);

    function handleSubmit(ev: FormEvent<HTMLFormElement>) {
        ev.preventDefault();

        const taskWithoutId = {
            title: titleRef.current!.value,
            description: descriptionRef.current!.value || null,
            date: dateRef.current!.value ? new Date(dateRef.current!.value) : null,
            time: timeRef.current!.value || null,
            location: locationRef.current!.value || null,
            nextTaskIds: nextTaskIds,
            previousTaskIds: previousTaskIds,
        };

        onSubmit(taskWithoutId);
    }

    return (
        <form className="task-form" onSubmit={handleSubmit}>
            <div className="task-form__form-group">
                <label htmlFor="task-form-title"><HiPencil /> Title</label>
                <input id="task-form-title" className="task-form__input" type="text" required ref={titleRef} />
            </div>
            <div className="task-form__form-group">
                <label htmlFor="task-form-date"><HiCalendarDays /> Date</label>
                <input id="task-form-date" className="task-form__input" type="date" ref={dateRef} />
            </div>
            <div className="task-form__form-group">
                <label htmlFor="task-form-time"><HiOutlineClock /> Time</label>
                <input id="task-form-time" className="task-form__input" type="time" ref={timeRef} />
            </div>
            <div className="task-form__form-group">
                <label htmlFor="task-form-location"><HiOutlineMapPin /> Location</label>
                <input id="task-form-location" className="task-form__input" type="text" ref={locationRef} />
            </div>
            <div className="task-form__form-group">
                <label htmlFor="task-form-description"><HiDocumentText /> Description</label>
                <textarea id="task-form-description" className="task-form__input" rows={3} ref={descriptionRef} />
            </div>
            <TaskPicker
                thisTaskId={thisTaskIdRef.current}
                title="Previous Tasks"
                selectedTaskIds={previousTaskIds}
                setSelectedTaskIds={setPreviousTaskIds}
            />
            <TaskPicker
                thisTaskId={thisTaskIdRef.current}
                title="Next Tasks"
                selectedTaskIds={nextTaskIds}
                setSelectedTaskIds={setNextTaskIds}
            />
            <ErrorAlert error={error} />
            <button type="submit" className="task-form__submit-button" disabled={loading}>{actionName || "Submit"}</button>
        </form>
    );
}

export default TaskForm;
