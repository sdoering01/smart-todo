import { inferAsyncReturnType } from '@trpc/server';
import * as trpcStandalone from '@trpc/server/adapters/standalone';
import db from "./db";
import { PublicUser } from './types';

export async function createContext({
    req,
    res,
}: trpcStandalone.CreateHTTPContextOptions) {
    let token: string | null | undefined = null;
    let user: PublicUser | null | undefined = null;

    if (req.headers.authorization) {
        token = req.headers.authorization.split(' ')[1];
        user = await db.user.findByToken(token);
    }

    return {
        token,
        user,
    };
}
export type Context = inferAsyncReturnType<typeof createContext>;
