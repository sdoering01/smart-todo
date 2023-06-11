import { z } from "zod";

import { User } from "./schema";

export const ApiLoginSchema = z.object({
    username: z.string().toLowerCase(),
    password: z.string(),
});
export type ApiLogin = z.infer<typeof ApiLoginSchema>;

export const ApiRegisterSchema = z.object({
    username: z.string()
        .trim()
        .toLowerCase()
        .nonempty({ message: "Username cannot be empty" })
        .max(20, { message: "Username cannot be longer than 20 characters" }),
    password: z.string()
        .trim()
        .nonempty({ message: "Password cannot be empty" })
        .min(12, { message: "Password cannot be shorter than 12 characters" })
        .max(100, { message: "Password cannot be longer than 100 characters" }),
    email: z.string()
        .toLowerCase()
        .email({ message: "Invalid email" }),
    fullname: z.string()
        .trim()
        .nonempty({ message: "Full name cannot be empty" }),
});
export type ApiRegister = z.infer<typeof ApiRegisterSchema>;

export type PublicUser = Omit<User, "hashedPassword">;

export type Task = {
    id: number;
    title: string;
    description: string | null;
    date: Date | null;
    time: string | null;
    location: string | null;
    nextTaskIds: number[];
}

export const CreateTaskSchema = z.object({
    title: z.string()
        .trim()
        .nonempty({ message: "Title cannot be empty" })
        .max(100, { message: "Title cannot be longer than 100 characters" }),
    description: z.string()
        .trim()
        .nonempty({ message: "Description cannot contain only whitespaces" })
        .max(1000, { message: "Description cannot be longer than 1000 characters" })
        .nullable(),
    date: z.coerce.date().nullable(),
    time: z.string()
        .regex(/^([0-1]\d|2[0-3]):[0-5]\d$/, { message: "Time has to be in format hh:mm" })
        .nullable(),
    location: z.string()
        .trim()
        .nonempty({ message: "Location cannot contain only whitespaces" })
        .max(100, { message: "Location cannot be longer than 100 characters" })
        .nullable(),
    nextTaskIds: z.array(z.number()).nullable(),
    previousTaskIds: z.array(z.number()).nullable(),
});
export type CreateTask = z.infer<typeof CreateTaskSchema>


export const UpdateTaskSchema = CreateTaskSchema.extend({
    id: z.number(),
});
export type UpdateTask = z.infer<typeof UpdateTaskSchema>
