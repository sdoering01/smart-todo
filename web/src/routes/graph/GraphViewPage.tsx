import { useEffect, useState } from "react";
import { HiCalendarDays, HiOutlineClock, HiOutlineMapPin, HiXMark, HiOutlineExclamationCircle, HiOutlineArrowLongRight } from "react-icons/hi2";

import "./GraphViewPage.css";
import useTasks from "../../lib/hooks/useTasks";
import { calcTaskLevels, isValidGraph } from "../../lib/graph-tools";
import { Task } from "../../lib/types";
import { formatDate } from "../../lib/date-helpers";
import TaskActionsMenu from "../../components/TaskActionsMenu";
import LogoutButton from "../../components/LogoutButton";
import { Link } from "react-router-dom";

type TaskWithLevel = Task & {
    level: number;
    idxInLevel: number;
};

type TaskWithLevelMap = Map<number, TaskWithLevel>;

const TASK_CARD_WIDTH = 260;
const TASK_CARD_HEIGHT = 38;
const TASK_CARD_EXPANDED_HEIGHT = 200;
const GRAPH_PADDING = 20;
const GRAPH_GAP_HORIZONTAL = 80;
const GRAPH_GAP_VERTICAL = 40;
const DEPENDENCY_STROKE_WIDTH = 4;

let showMobileWarning = true;

function calcTaskCardPos(level: number, idxInLevel: number) {
    return {
        top: GRAPH_PADDING + idxInLevel * (TASK_CARD_HEIGHT + GRAPH_GAP_VERTICAL),
        left: GRAPH_PADDING + level * (TASK_CARD_WIDTH + GRAPH_GAP_HORIZONTAL),
    };
}

function GraphMobileHeader() {
    const [warningShown, setWarningShown] = useState(showMobileWarning);

    function closeWarning() {
        showMobileWarning = false;
        setWarningShown(false);
    }

    return (
        <header className="graph__mobile-header">
            {warningShown && (
                <div className="graph__mobile-header-warning">
                    <HiOutlineExclamationCircle />
                    <span>The graph view is not optimized for mobile use, consider using a larger screen</span>
                    <button onClick={closeWarning}><HiXMark /></button>
                </div>
            )}
            <span className="graph__mobile-header__logout-wrapper">
                <LogoutButton round={false} />
            </span>
        </header>
    );
}

type TaskCardProps = {
    task: TaskWithLevel;
    selected: boolean;
    onSelect: () => void;
};

function TaskCard({ task, selected, onSelect }: TaskCardProps) {
    function handleClick(ev: React.MouseEvent) {
        ev.stopPropagation();
        onSelect();
    }

    return (
        <div
            className={`graph__task-card ${selected ? "graph__task-card--selected" : ""}`}
            style={calcTaskCardPos(task.level, task.idxInLevel)}
            onClick={handleClick}
        >
            <div className="graph__task-card-header">
                <h3 className="graph__task-card-title">{task.title}</h3>
                <TaskActionsMenu task={task} openButtonVariant="small" stopClickPropagation />
            </div>
            {selected && (
                <div className="graph__task-card-body">
                    <div className="graph__task-card__date-time-group">
                        <p className="graph__task-card__icon-group"><HiCalendarDays className="graph__task-card__body-icon" /> {task.date ? formatDate(task.date) : "-"}</p>
                        <p className="graph__task-card__icon-group"><HiOutlineClock className="graph__task-card__body-icon" /> {task.time || "-"}</p>
                    </div>
                    <p className="graph__task-card__icon-group"><HiOutlineMapPin className="graph__task-card__body-icon" /> {task.location || "-"}</p>
                    <p className="graph__task-card-description">{task.description || null}</p>
                    <Link to={`/list/${task.id}`} className="graph__task-card-link">View in List <HiOutlineArrowLongRight /></Link>
                </div>
            )}
        </div>
    );
}

type TaskDependenciesProps = {
    tasks: TaskWithLevelMap;
    selectedTaskId: number | null;
    widthPx: number;
    heightPx: number;
};

function TaskDependencies({ tasks, selectedTaskId, widthPx, heightPx }: TaskDependenciesProps) {
    const dependencies: { from: number, to: number }[] = [];
    for (const task of tasks.values()) {
        task.nextTaskIds.forEach(nextTaskId => {
            dependencies.push({ from: task.id, to: nextTaskId });
        });
    }

    const unselectedDependencies: JSX.Element[] = [];
    const selectedDependencies: JSX.Element[] = [];

    dependencies.forEach(({from, to}) => {
        const selected = selectedTaskId === from || selectedTaskId === to;

        const fromTask = tasks.get(from)!;
        const toTask = tasks.get(to)!;
        const fromCardPos = calcTaskCardPos(fromTask.level, fromTask.idxInLevel);
        const toCardPos = calcTaskCardPos(toTask.level, toTask.idxInLevel);

        const fromX = fromCardPos.left + TASK_CARD_WIDTH;
        const fromY = fromCardPos.top + 0.5 * TASK_CARD_HEIGHT;
        const toX = toCardPos.left;
        const toY = toCardPos.top + 0.5 * TASK_CARD_HEIGHT;

        const xDiff = toX - fromX;
        const yDiff = toY - fromY;

        const path = (
            <path
                key={from + "-" + to}
                className={`graph__task-dependency ${selected ? "graph__task-dependency--selected" : ""}`}
                d={`M${fromX},${fromY} c ${xDiff / 4} 0, ${xDiff / 3} ${yDiff / 4}, ${xDiff / 2} ${yDiff / 2} s ${xDiff / 4} ${yDiff / 2}, ${xDiff / 2} ${yDiff / 2}`}
                fill="none"
                strokeWidth={DEPENDENCY_STROKE_WIDTH}
            />
        );

        if (selected) {
            selectedDependencies.push(path);
        } else {
            unselectedDependencies.push(path);
        }
    });

    return (
        <>
            <svg className="graph__dependency-svg" width={widthPx} height={heightPx}>
                { unselectedDependencies }
            </svg>
            <svg className="graph__dependency-svg" width={widthPx} height={heightPx}>
                { selectedDependencies }
            </svg>
        </>
    );
}

function GraphViewPage() {
    const { tasks } = useTasks();

    const [validGraph, setValidGraph] = useState<boolean | null>(null);
    const [tasksWithLevel, setTasksWithLevel] = useState<TaskWithLevelMap>(new Map());
    const [graphSize, setGraphSize] = useState({ levels: 0, maxTasksInLevel: 0 });

    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

    useEffect(() => {
        const valid = isValidGraph(tasks);
        if (valid) {
            const taskLevels = calcTaskLevels(tasks);
            let maxTasksInLevel = 0;
            const newTasksWithLevel: TaskWithLevelMap = new Map();
            taskLevels.forEach((tasksInLevel, level) => {
                tasksInLevel.forEach((taskId, idxInLevel) => {
                    const task = tasks.get(taskId)!;
                    newTasksWithLevel.set(taskId, { ...task, level, idxInLevel });
                })
                if (tasksInLevel.length > maxTasksInLevel) {
                    maxTasksInLevel = tasksInLevel.length;
                }
            })
            setTasksWithLevel(newTasksWithLevel);
            setGraphSize({ levels: taskLevels.length, maxTasksInLevel });
        } else {
            setTasksWithLevel(new Map());
            setGraphSize({ levels: 0, maxTasksInLevel: 0 });
        }
        setValidGraph(valid);
    }, [tasks]);

    function handleUnselectTask() {
        setSelectedTaskId(null);
    }

    if (validGraph === null) {
        return <h2>Loading...</h2>;
    } else if (!validGraph) {
        return <h2>Graph is invalid</h2>;
    } else {
        // TODO: Catch empty graph case

        const graphWidthPx = 2 * GRAPH_PADDING + graphSize.levels * TASK_CARD_WIDTH + (graphSize.levels - 1) * GRAPH_GAP_HORIZONTAL;
        const graphHeightPx = 2 * GRAPH_PADDING + graphSize.maxTasksInLevel * TASK_CARD_HEIGHT + (graphSize.maxTasksInLevel - 1) * GRAPH_GAP_VERTICAL + TASK_CARD_EXPANDED_HEIGHT - TASK_CARD_HEIGHT;

        return (
            <div
                className="graph__wrapper"
                onClick={handleUnselectTask}
                style={{
                    "--task-card-width": `${TASK_CARD_WIDTH}px`,
                    "--task-card-height": `${TASK_CARD_HEIGHT}px`,
                    "--task-card-expanded-height": `${TASK_CARD_EXPANDED_HEIGHT}px`,
                    "width": `${graphWidthPx}px`,
                    "height": `${graphHeightPx}px`,
                } as React.CSSProperties}
            >
                <GraphMobileHeader />
                <TaskDependencies tasks={tasksWithLevel} selectedTaskId={selectedTaskId} widthPx={graphWidthPx} heightPx={graphHeightPx} />
                {Array.from(tasksWithLevel.values()).map((task) => {
                    const selected = selectedTaskId === task.id;
                    return (
                        <TaskCard
                            key={task.id}
                            task={task}
                            selected={selected}
                            onSelect={setSelectedTaskId.bind(null, selected ? null : task.id)}
                        />
                    );
                })}
            </div>
        );
    }
}

export default GraphViewPage;
