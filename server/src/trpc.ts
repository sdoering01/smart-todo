import { TRPCError, initTRPC } from '@trpc/server';
import { Context } from './context';
import { ZodError } from 'zod';

const tranformZodError = (error: ZodError): string => {
    const flattenedError = error.flatten();

    for (const errorsOfField of Object.values(flattenedError.fieldErrors)) {
        if (errorsOfField) {
            return errorsOfField[0];
        }
    }

    return flattenedError.formErrors[0] ?? 'Invalid input';
};

const t = initTRPC.context<Context>().create({
    errorFormatter(opts) {
        const { shape, error } = opts;
        return {
            ...shape,
            message:
                error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
                    ? tranformZodError(error.cause)
                    : shape.message,
        };
    },
});

const requireAuth = t.middleware((opts) => {
    const { ctx } = opts;
    if (!ctx.user || !ctx.token) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
    }
    return opts.next({
        ctx: {
            user: ctx.user,
            token: ctx.token,
        },
    });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const userProcedure = t.procedure.use(requireAuth);
