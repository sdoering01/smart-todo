create table tasks (
  id SERIAL primary key,
  title varchar not null,
  description text,
  location varchar,
  start_date date,
  start_time time
 );
 
 create table next_task_map (
  task_id int not null references tasks(id),
  next_task_id int not null references tasks(id),
  primary key (task_id, previous_task_id)
 );
