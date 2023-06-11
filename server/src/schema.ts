import { pgTable, serial, text, integer, date, primaryKey, timestamp } from "drizzle-orm/pg-core";
import { InferModel, relations } from "drizzle-orm";

// Should use citext instead of text for username and email
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull(),
    email: text("email").notNull(),
    fullname: text("fullname").notNull(),
    hashedPassword: text("hashedPassword").notNull(),
});
export const usersRelations = relations(users, ({ many }) => ({
    tasks: many(tasks),
    sessions: many(userSessions),
}));
export type User = InferModel<typeof users, "select">;

export const userSessions = pgTable("userSessions", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
});
export const userSessionsRelations = relations(userSessions, ({ one }) => ({
    user: one(users, {
        fields: [userSessions.userId],
        references: [users.id],
    }),
}));

export const tasks = pgTable("tasks", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    date: date("date", { mode: "date" }),
    time: text("time"),
    location: text("location"),
});
export const tasksRelations = relations(tasks, ({ one, many }) => ({
    user: one(users, {
        fields: [tasks.userId],
        references: [users.id],
    }),
    nextTasks: many(nextTasks),
}));

export const nextTasks = pgTable("nextTasks", {
    taskId: integer("taskId").notNull().references(() => tasks.id, { onDelete: "cascade" }),
    nextTaskId: integer("nextTaskId").notNull().references(() => tasks.id, { onDelete: "cascade" }),
}, (table) => {
    return {
        pk: primaryKey(table.taskId, table.nextTaskId)
    }
});
export const nextTasksRelations = relations(nextTasks, ({ one }) => ({
    task: one(tasks, {
        fields: [nextTasks.taskId],
        references: [tasks.id],
    }),
    nextTask: one(tasks, {
        fields: [nextTasks.nextTaskId],
        references: [tasks.id],
    }),
}));

