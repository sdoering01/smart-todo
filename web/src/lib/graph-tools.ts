import { Task, TaskMap } from "./types";

export function isValidGraph(graph: TaskMap): boolean {
    try {
        return !hasCircle(graph, getRoodIds(graph));
    } catch (e) {
        console.error("Error validating graph:", e);
        return false;
    }
}

/**
 * @param path - Set of ids that have been visited in the current path
 * @param checked - Set of ids that have already been checked
 */
function hasCircle(graph: TaskMap, nextIds: number[], path: Set<number> = new Set(), checked: Set<number> = new Set()): boolean {
    for (const nextId of nextIds) {
        if (checked.has(nextId)) {
            continue;
        }

        if (path.has(nextId)) {
            return true;
        }

        path.add(nextId);
        const thisNextIds = graph.get(nextId)?.nextTaskIds;
        if (thisNextIds == null) {
            throw new Error(`Task with id ${nextId} does not exist in the graph`);
        }

        if (hasCircle(graph, thisNextIds, path)) {
            return true;
        }

        checked.add(nextId);
        path.delete(nextId);
    }

    return false;
}

export function getRootTasks(graph: TaskMap): Task[] {
    return Array.from(graph.values()).filter(el => el.previousTaskIds.length === 0);
}

export function getRoodIds(graph: TaskMap): number[] {
    return getRootTasks(graph).map(el => el.id);
}

/**
 * Returns an array of array, where each array contains the ids of the tasks on that level. The first array contains the ids of the root tasks.
 *
 * Assumes that the graph is valid.
 */
export function calcTaskLevels(graph: TaskMap): number[][] {
    const idToLevel = new Map<number, number>();

    for (const rootId of getRoodIds(graph)) {
        calcTaskLevelsRecursive(graph, rootId, idToLevel);
    }

    const levels: number[][] = [];
    for (const [id, level] of idToLevel) {
        const ids = levels[level] ?? [];
        ids.push(id);
        levels[level] = ids;
    }

    return levels;
}

function calcTaskLevelsRecursive(graph: TaskMap, id: number, idToLevel: Map<number, number>, level: number = 0): void {
    const task = graph.get(id)!;

    const taskLevel = idToLevel.get(id) ?? 0;
    idToLevel.set(id, Math.max(taskLevel, level));

    for (const nextId of task.nextTaskIds) {
        calcTaskLevelsRecursive(graph, nextId, idToLevel, level + 1);
    }
}
