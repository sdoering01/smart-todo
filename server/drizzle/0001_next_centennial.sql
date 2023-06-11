CREATE TABLE IF NOT EXISTS "userSessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "nextTasks" ALTER COLUMN "taskId" SET NOT NULL;
ALTER TABLE "nextTasks" ALTER COLUMN "nextTaskId" SET NOT NULL;
ALTER TABLE "tasks" ALTER COLUMN "userId" SET NOT NULL;
DO $$ BEGIN
 ALTER TABLE "userSessions" ADD CONSTRAINT "userSessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
