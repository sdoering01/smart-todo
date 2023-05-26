create table users (
  username varchar primary key,
  fullname varchar not null,
  email varchar not null,
  password bytea not null,
  salt bytea not null
);

create table tasks (
  id SERIAL primary key,
  username varchar not null references users(username),
  title varchar not null,
  description text,
  location varchar,
  start_date date,
  start_time time
);
 
create table next_task_map (
  task_id int not null references tasks(id) on delete cascade,
  next_task_id int not null references tasks(id),
  primary key (task_id, next_task_id)
);
