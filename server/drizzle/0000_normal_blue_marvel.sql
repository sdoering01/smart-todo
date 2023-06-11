CREATE TABLE IF NOT EXISTS "nextTasks" (
	"taskId" integer,
	"nextTaskId" integer
);
--> statement-breakpoint
ALTER TABLE "nextTasks" ADD CONSTRAINT "nextTasks_taskId_nextTaskId" PRIMARY KEY("taskId","nextTaskId");

CREATE TABLE IF NOT EXISTS "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"title" text NOT NULL,
	"description" text,
	"date" date,
	"time" text,
	"location" text
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"fullname" text NOT NULL,
	"hashedPassword" text NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "nextTasks" ADD CONSTRAINT "nextTasks_taskId_tasks_id_fk" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "nextTasks" ADD CONSTRAINT "nextTasks_nextTaskId_tasks_id_fk" FOREIGN KEY ("nextTaskId") REFERENCES "tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
