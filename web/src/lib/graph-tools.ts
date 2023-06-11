import { Task, TaskMap } from "./types";

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

    for (const level of levels) {
        level.sort((a, b) => a - b);
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
