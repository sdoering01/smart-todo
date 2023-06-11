import { z } from 'zod';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import cors from 'cors';
import { TRPCError } from '@trpc/server';

import { createContext } from './context';
import { ApiLoginSchema, ApiRegisterSchema, CreateTaskSchema, UpdateTaskSchema } from './types';
import db from './db';
import { publicProcedure, router, userProcedure } from './trpc';
import { PORT } from './config';

const appRouter = router({
    login: publicProcedure
        .input(ApiLoginSchema)
        .mutation(async (opts) => {
            const { input } = opts;
            // Create a new user in the database
            const user = await db.user.findByNameAndPassword(input);
            if (!user) {
                throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
            }
            const token = await db.user.generateSessionToken(user.id);
            return { token, user };
        }),
    register: publicProcedure
        .input(ApiRegisterSchema)
        .mutation(async (opts) => {
            const { input } = opts;
            const user = await db.user.create(input);
            const token = await db.user.generateSessionToken(user.id);
            return { token, user };
        }),
    logout: userProcedure
        .mutation(async (opts) => {
            const { ctx } = opts;
            await db.user.invalidateSessionToken(ctx.token);
            return true;
        }),
    taskList: userProcedure
        .query(async (opts) => {
            const { ctx } = opts;
            const tasks = await db.tasks.findByUser(ctx.user.id);
            return tasks;
        }),
    createTask: userProcedure
        .input(CreateTaskSchema)
        .mutation(async (opts) => {
            const { input, ctx } = opts;
            const task = await db.tasks.create(ctx.user.id, input);
            return task;
        }),
    updateTask: userProcedure
        .input(UpdateTaskSchema)
        .mutation(async (opts) => {
            const { input, ctx } = opts;
            const task = await db.tasks.update(ctx.user.id, input);
            return task;
        }),
    deleteTask: userProcedure
        .input(z.number())
        .mutation(async (opts) => {
            const { input, ctx } = opts;
            const task = await db.tasks.delete(ctx.user.id, input);
            return task;
        }),
});

export type AppRouter = typeof appRouter;

if (process.argv[2] === 'migrate') {
    db.migrate()
        .catch(console.error)
        .then(() => console.log("Migration done"))
        .finally(() => process.exit(0));
} else {
    const server = createHTTPServer({
        middleware: cors(),
        createContext: createContext,
        router: appRouter,
    });

    server.listen(PORT);
}
