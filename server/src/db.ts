import * as argon2 from "argon2";
import crypto from "crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { InferModel, eq, and, or, sql, gt } from "drizzle-orm";
import postgres from 'postgres';
import { TRPCError } from "@trpc/server";

import { ApiRegister, CreateTask, Task, UpdateTask, PublicUser } from "./types";
import * as schema from "./schema";
import { DATABASE_CONNECTION_URL, NODE_ENV } from "./config";

const client = postgres(DATABASE_CONNECTION_URL, {
    debug: NODE_ENV !== "production"
        ? (_conn, query, params, _paramTypes) => console.log(query, params)
        : undefined
});
const db = drizzle(client, { schema });

const USER_SESSION_EXPIRATION_IN_DAYS = 60;

function prepareNextTasksValues(
    input: { thisTaskId: number, nextTaskIds: number[] | null, previousTaskIds: number[] | null }
): InferModel<typeof schema.nextTasks, "insert">[] {
    const nextTasksValues: InferModel<typeof schema.nextTasks, "insert">[] = [];
    if (input.nextTaskIds) {
        input.nextTaskIds.forEach(nextTaskId => nextTasksValues.push({
            taskId: input.thisTaskId,
            nextTaskId,
        }));
    }
    if (input.previousTaskIds) {
        input.previousTaskIds.map(previousTaskId => nextTasksValues.push({
            taskId: previousTaskId,
            nextTaskId: input.thisTaskId,
        }));
    }
    return nextTasksValues;
}

async function ensureNoCirlces(userId: number, thisDb: typeof db) {
    function hasCirlce() {
        const checked = new Set<number>();
        for (const task of newUserTasks) {
            if (hasCircleRecursive(graph, [task.id], new Set(), checked)) {
                return true;
            }
        }
    }

    function hasCircleRecursive(
        graph: Map<number, Task>,
        nextIds: number[],
        path: Set<number> = new Set(),
        checked: Set<number> = new Set(),
    ): boolean {
        for (const nextId of nextIds) {
            if (checked.has(nextId)) {
                continue;
            }

            if (path.has(nextId)) {
                return true;
            }

            path.add(nextId);
            const thisNextIds = graph.get(nextId)!.nextTaskIds;

            if (hasCircleRecursive(graph, thisNextIds, path)) {
                return true;
            }

            checked.add(nextId);
            path.delete(nextId);
        }

        return false;
    }

    const newUserTasks = await dbFunctions.tasks.findByUser(userId, thisDb);

    const graph = new Map<number, Task>();
    for (const task of newUserTasks) {
        graph.set(task.id, task);
    }

    if (hasCirlce()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot create a task that creates a loop" });
    }
}

// TODO: Better error handling for database errors
const dbFunctions = {
    migrate: async () => {
        await migrate(db, { migrationsFolder: "./drizzle" });
    },
    user: {
        findByToken: async (token: string): Promise<PublicUser | undefined> => {
            const [user] = await db
                .select({
                    id: schema.users.id,
                    username: schema.users.username,
                    email: schema.users.email,
                    fullname: schema.users.fullname,
                })
                .from(schema.users)
                .leftJoin(schema.userSessions, eq(schema.userSessions.userId, schema.users.id))
                .where(
                    and(
                        eq(schema.userSessions.token, token),
                        gt(schema.userSessions.createdAt, sql`now() - make_interval(days => ${USER_SESSION_EXPIRATION_IN_DAYS})`),
                    ),
                );
            return user;
        },
        findByNameAndPassword: async (input: { username: string, password: string }): Promise<PublicUser | undefined> => {
            const user = await db.query.users.findFirst({
                where: (user, { eq }) => eq(user.username, input.username),
            });
            if (user && await argon2.verify(user.hashedPassword, input.password)) {
                const { hashedPassword, ...publicUser } = user;
                return publicUser;
            }
            return undefined;
        },
        create: async (input: ApiRegister): Promise<PublicUser> => {
            // Could be done with database unique constraints once drizzle-orm supports them
            const existingUser = await db.query.users.findFirst({
                where: (user, { or, eq }) => or(
                    eq(user.username, input.username),
                    eq(user.email, input.email),
                ),
            });

            if (existingUser) {
                if (existingUser.username === input.username) {
                    throw new TRPCError({ code: "CONFLICT", message: "Username is already taken" });
                } else {
                    throw new TRPCError({ code: "CONFLICT", message: "Email is already associated with an account" });
                }
            }

            const hashedPassword = await argon2.hash(input.password);
            const [user] = await db.insert(schema.users)
                .values({
                    username: input.username,
                    email: input.email,
                    fullname: input.fullname,
                    hashedPassword,
                })
                .returning({
                    id: schema.users.id,
                    username: schema.users.username,
                    email: schema.users.email,
                    fullname: schema.users.fullname,
                });
            return user;
        },
        generateSessionToken: async (userId: number): Promise<string> => {
            const token = crypto.randomBytes(32).toString('base64url');
            await db.insert(schema.userSessions).values({ userId, token });
            return token;
        },
        invalidateSessionToken: async (token: string): Promise<void> => {
            await db.delete(schema.userSessions).where(eq(schema.userSessions.token, token));
        }
    },
    tasks: {
        findByUser: async (userId: number, thisDb: typeof db | null = null): Promise<Task[]> => {
            // Allow passing in a transaction
            thisDb = thisDb ?? db;
            const userTasks = await thisDb
                .select({
                    id: schema.tasks.id,
                    title: schema.tasks.title,
                    description: schema.tasks.description,
                    date: schema.tasks.date,
                    time: schema.tasks.time,
                    location: schema.tasks.location,
                    nextTaskIds: sql`json_agg(${schema.nextTasks.nextTaskId})`
                        .mapWith({
                            mapFromDriverValue: (nextTaskIds) => {
                                // Either: [1, 2, 3, ...] or [null]
                                if (nextTaskIds && nextTaskIds[0] != null) {
                                    return nextTaskIds;
                                }
                                return [];
                            }
                        })
                        .as("nextTaskIds"),
                })
                .from(schema.tasks)
                .groupBy(schema.tasks.id)
                .leftJoin(schema.nextTasks, eq(schema.nextTasks.taskId, schema.tasks.id))
                .where(eq(schema.tasks.userId, userId));

            return userTasks;
        },
        create: async (userId: number, input: CreateTask): Promise<Task> => {
            let createdTask = await db.transaction(async (tx) => {
                const [task] = await tx.insert(schema.tasks)
                    .values({
                        userId,
                        title: input.title,
                        description: input.description,
                        date: input.date,
                        time: input.time,
                        location: input.location,
                    })
                    .returning();

                const nextTasksValues = prepareNextTasksValues({
                    thisTaskId: task.id,
                    nextTaskIds: input.nextTaskIds,
                    previousTaskIds: input.previousTaskIds
                });
                if (nextTasksValues.length > 0) {
                    await tx.insert(schema.nextTasks).values(nextTasksValues);
                    await ensureNoCirlces(userId, tx);
                }

                return { ...task, nextTaskIds: input.nextTaskIds || [] };
            });

            return createdTask;
        },
        update: async (userId: number, input: UpdateTask): Promise<Task> => {
            const updatedTask = await db.transaction(async (tx) => {
                const [task] = await tx.update(schema.tasks)
                    .set({
                        title: input.title,
                        description: input.description,
                        date: input.date,
                        time: input.time,
                        location: input.location,
                    })
                    .where(
                        and(
                            eq(schema.tasks.id, input.id),
                            eq(schema.tasks.userId, userId),
                        ),
                    )
                    .returning();

                if (task == null) {
                    throw new TRPCError({ code: "NOT_FOUND", message: `Task with ID ${input.id} not found` });
                }

                await tx.delete(schema.nextTasks)
                    .where(
                        or(
                            eq(schema.nextTasks.taskId, input.id),
                            eq(schema.nextTasks.nextTaskId, input.id),
                        ),
                    );

                const nextTasksValues = prepareNextTasksValues({
                    thisTaskId: input.id,
                    nextTaskIds: input.nextTaskIds,
                    previousTaskIds: input.previousTaskIds,
                });
                if (nextTasksValues.length > 0) {
                    await tx.insert(schema.nextTasks).values(nextTasksValues);
                    await ensureNoCirlces(userId, tx);
                }

                return { ...task, nextTaskIds: input.nextTaskIds || [] };
            });

            return updatedTask;
        },
        delete: async (userId: number, taskId: number): Promise<void> => {
            const deletedTasks = await db.delete(schema.tasks)
                .where(
                    and(
                        eq(schema.tasks.id, taskId),
                        eq(schema.tasks.userId, userId),
                    ),
                )
                .returning({ id: schema.tasks.id });

            if (deletedTasks.length === 0) {
                throw new TRPCError({ code: "NOT_FOUND", message: `Task with ID ${taskId} not found` });
            }
        }
    }
};

export default dbFunctions;
