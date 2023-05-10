package main

import (
	"database/sql"
	"errors"
	"fmt"
	"regexp"

	_ "github.com/lib/pq"
)

type Db struct {
	db               *sql.DB
	regexExpressions struct {
		regexDateReplace *regexp.Regexp
		regexTimeReplace *regexp.Regexp
	}
}

func (db *Db) Connect(conf Conf) error {
	connStr := fmt.Sprintf(
		"host='%s' port=%d user='%s' password='%s' dbname='%s'",
		conf.Database.Domain,
		conf.Database.Port,
		conf.Database.Username,
		conf.Database.Password,
		conf.Database.Database,
	)
	var err error
	db.db, err = sql.Open("postgres", connStr)
	if err != nil {
		return err
	}
	db.regexExpressions.regexDateReplace = regexp.MustCompile("^([0-9]{4}-[0-9]{2}-[0-9]{2})T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$")
	db.regexExpressions.regexTimeReplace = regexp.MustCompile("^[0-9]{4}-[0-9]{2}-[0-9]{2}T([0-9]{2}:[0-9]{2}):[0-9]{2}Z$")
	return nil
}

func (db *Db) Disconnect() error {
	err := db.db.Close()
	return err
}

func (db *Db) SelectAllTasks() ([]Task, error) {
	rows, err := db.db.Query(
		"SELECT id, title, description, location," +
			"start_date, start_time, array_agg(next_task_map.next_task_id) " +
			"FROM tasks LEFT JOIN next_task_map ON id=next_task_map.task_id " +
			"GROUP BY id ORDER BY id",
	)
	if err != nil {
		return nil, err
	}
	tasks := make([]Task, 0)
	defer rows.Close()
	for rows.Next() {
		task, err := parseRowToTask(rows)
		if err != nil {
			return nil, err
		}
		fmt.Println(task)
		tasks = append(tasks, task)
	}
	return tasks, nil
}

func parseRowToTask(rows *sql.Rows) (Task, error) {
	var id uint
	var title string
	var description, location, date, time sql.NullString
	var nextTasks ArrayAggInt
	// var nextTasksInt []uint
	if err := rows.Scan(&id, &title, &description, &location, &date, &time, &nextTasks); err != nil {
		return Task{}, err
	}
	var task Task
	task.Id = id
	task.Title = title
	if description.Valid {
		task.Description = description.String
	}
	if location.Valid {
		task.Location = location.String
	}
	if date.Valid {
		task.Date = db.regexExpressions.regexDateReplace.ReplaceAllString(date.String, "$1")
	}
	if time.Valid {
		task.Time = db.regexExpressions.regexTimeReplace.ReplaceAllString(time.String, "$1")
	}
	if nextTasks.Valid {
		task.NextTaskIds = nextTasks.Value
	} else {
		task.NextTaskIds = make([]uint, 0)
	}
	return task, nil
}

func (db *Db) SelectOneSpecialTasks(id uint) (Task, error) {
	rows, err := db.db.Query(
		"SELECT id, title, description, location, "+
			"start_date, start_time, array_agg(next_task_map.next_task_id) "+
			"FROM tasks "+
			"LEFT JOIN next_task_map ON id=next_task_map.task_id "+
			"WHERE id = $1 GROUP BY id ORDER BY id ", id)
	if err != nil {
		return Task{}, err
	}
	tasks := make([]Task, 0)
	defer rows.Close()
	for rows.Next() {
		task, err := parseRowToTask(rows)
		if err != nil {
			return Task{}, err
		}
		tasks = append(tasks, task)
	}
	if len(tasks) == 1 {
		return tasks[0], nil
	}
	errorStr := fmt.Sprintf("Can't find task with id %d", id)
	return Task{}, errors.New(errorStr)
}
