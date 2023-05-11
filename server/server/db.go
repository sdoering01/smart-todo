package main

import (
	"database/sql"
	"errors"
	"fmt"
	"regexp"
	"strings"

	_ "github.com/lib/pq"
)

const VOLATILE_FOREIGN_KEY_INSERT_UPDATE_ERROR_MSG = "pq: insert or update " +
	"on table \"next_task_map\" violates foreign key constraint " +
	"\"next_task_map_next_task_id_fkey\""
const VOLATILE_FOREIGN_KEY_DELETE_UPDATE_ERROR_MSG = "pq: update or delete " +
	"on table \"tasks\" violates foreign key constraint " +
	"\"next_task_map_next_task_id_fkey\" on table \"next_task_map\""
const NO_ROW_IN_OUTPUT_ERROR_MSG = "sql: no rows in result set"

type Db struct {
	db               *sql.DB
	regexExpressions struct {
		regexDateReplace *regexp.Regexp
		regexTimeReplace *regexp.Regexp
	}
}

func (db *Db) Connect(conf Conf) error {
	connStr := fmt.Sprintf(
		"host='%s' port=%d user='%s' password='%s' dbname='%s' sslmode=disable",
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
	db.regexExpressions.regexDateReplace = regexp.MustCompile(
		"^([0-9]{4}-[0-9]{2}-[0-9]{2})T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$",
	)
	db.regexExpressions.regexTimeReplace = regexp.MustCompile(
		"^[0-9]{4}-[0-9]{2}-[0-9]{2}T([0-9]{2}:[0-9]{2}):[0-9]{2}Z$",
	)
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
		task, err := parseRowToTask(rows, db)
		if err != nil {
			return nil, err
		}
		tasks = append(tasks, task)
	}
	return tasks, nil
}

func parseRowToTask(rows *sql.Rows, db *Db) (Task, error) {
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
		task, err := parseRowToTask(rows, db)
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

func (db *Db) InsertTask(task CreateTask) (uint, error) {
	var id uint = 0
	if !ValidateCreateTask(&task) {
		return 0, errors.New("CreateTask not valid")
	}
	var date any = task.Date
	if date == "" {
		date = sql.NullTime{}
	}
	var time any = task.Time
	if time == "" {
		time = sql.NullTime{}
	}
	err := db.db.QueryRow(
		`INSERT INTO
		tasks(title, description, location, start_date, start_time)
		VALUES ($1, $2, $3, $4, $5) RETURNING id`,
		task.Title,
		task.Description,
		task.Location,
		date,
		time,
	).Scan(&id)
	if err != nil {
		return 0, err
	}
	if len(task.PreviousTaskIds) > 0 {
		err := db.insertPreviousTaskIds(id, task.PreviousTaskIds)
		// for _, pt := range task.PreviousTaskIds {
		// 	err := db.insertNextTaskIds(pt, []uint{id})
		if err != nil {
			db.DeleteTask(id)
			return 0, err
		}
		// }
	}
	if len(task.NextTaskIds) > 0 {
		err := db.insertNextTaskIds(id, task.NextTaskIds)
		if err != nil {
			db.DeleteTask(id)
			return 0, err
		}
	}
	return id, nil
}

func (db *Db) insertNextTaskIds(id uint, nextTaskIds []uint) error {
	insertNextIdsQuery := "INSERT INTO next_task_map VALUES "
	values := make([]any, 0)
	var delimiter string
	for i, nt := range nextTaskIds {
		insertNextIdsQuery += fmt.Sprintf("%s(%d, $%d)", delimiter, id, i+1)
		values = append(values, nt)
		if delimiter == "" {
			delimiter = ", "
		}

	}
	_, err := db.db.Query(insertNextIdsQuery, values...)
	if err != nil {
		if strings.Contains(err.Error(), VOLATILE_FOREIGN_KEY_INSERT_UPDATE_ERROR_MSG) {
			return errors.New("One as next tasks refererenced tasks not exists")
		}
		return err
	}
	return nil
}

func (db *Db) insertPreviousTaskIds(id uint, previousTaskIds []uint) error {
	insertPreviousIdsQuery := "INSERT INTO next_task_map VALUES "
	values := make([]any, 0)
	var delimiter string
	for i, pt := range previousTaskIds {
		insertPreviousIdsQuery += fmt.Sprintf("%s($%d, %d)", delimiter, i+1, id)
		values = append(values, pt)
		if delimiter == "" {
			delimiter = ", "
		}

	}
	_, err := db.db.Query(insertPreviousIdsQuery, values...)
	if err != nil {
		if strings.Contains(err.Error(), VOLATILE_FOREIGN_KEY_INSERT_UPDATE_ERROR_MSG) {
			return errors.New("One as next tasks refererenced tasks not exists")
		}
		return err
	}
	return nil
}

func (db *Db) DeleteTask(id uint) error {
	var deleteId uint
	err := db.db.QueryRow(
		"DELETE FROM tasks WHERE id = $1 RETURNING id",
		id,
	).Scan(&deleteId)
	if err != nil {
		if err.Error() == NO_ROW_IN_OUTPUT_ERROR_MSG {
			return errors.New(fmt.Sprintf("Task %d not found", id))
		} else if strings.Contains(err.Error(), VOLATILE_FOREIGN_KEY_DELETE_UPDATE_ERROR_MSG) {
			return errors.New(
				fmt.Sprintf(
					"Task %d is a follower for another task and must not be delete",
					id,
				),
			)
		} else {
			return err
		}
	}
	return nil
}

func (db *Db) UpdateTask(id uint, patchTask CreateTask, patchKeys []string) error {
	var updateId uint
	query := "UPDATE tasks SET "
	i := 1
	var delimiter string
	values := make([]any, 0)
	nextTaskIdsIdx := false
	previousTaskIdsIdx := false
	for _, key := range patchKeys {
		if key != "nextTaskIds" && key != "previousTaskIds" {
			columnName := key
			value, ok := patchTask.GetByKey(key)
			if !ok {
				return errors.New(fmt.Sprintf("Canot get value for key %s", key))
			}
			if key == "date" || key == "time" {
				columnName = "start_" + key
				if value == "" {
					value = sql.NullTime{}
				}
			}
			query += fmt.Sprintf("%s%s = $%d", delimiter, columnName, i)
			values = append(values, value)
			if i == 1 {
				delimiter = ", "
			}
			i++
		} else {
			if key == "nextTaskIds" {
				nextTaskIdsIdx = true
			} else {
				previousTaskIdsIdx = true
			}
		}
	}
	if len(values) > 0 {
		values = append(values, id)
		query += fmt.Sprintf(" WHERE id = $%d RETURNING id", i)
		err := db.db.QueryRow(query, values...).Scan(&updateId)
		if err != nil {
			if err.Error() == NO_ROW_IN_OUTPUT_ERROR_MSG {
				return errors.New(fmt.Sprintf("Task %d not found to update", id))
			}
			return err
		}
	}
	// Update next references
	if nextTaskIdsIdx {
		var deletedId uint
		err := db.db.
			QueryRow("DELETE FROM next_task_map WHERE task_id = $1 RETURNING task_id", id).
			Scan(&deletedId)
		if err != nil {
			if err.Error() != NO_ROW_IN_OUTPUT_ERROR_MSG {
				return err
			}
		}
		if len(patchTask.NextTaskIds) > 0 {
			err = db.insertNextTaskIds(id, patchTask.NextTaskIds)
			if err != nil {
				if err.Error() == NO_ROW_IN_OUTPUT_ERROR_MSG {
					return errors.New(fmt.Sprintf("Task %d not found to update", id))
				}
				return err
			}
		}
	}
	// Update previous references
	if previousTaskIdsIdx {
		var deletedId uint
		err := db.db.
			QueryRow("DELETE FROM next_task_map WHERE next_task_id = $1 RETURNING task_id", id).
			Scan(&deletedId)
		if err != nil {
			if err.Error() != NO_ROW_IN_OUTPUT_ERROR_MSG {
				return err
			}
		}
		if len(patchTask.PreviousTaskIds) > 0 {
			err = db.insertPreviousTaskIds(id, patchTask.PreviousTaskIds)
			if err != nil {
				// if err.Error() == NO_ROW_IN_OUTPUT_ERROR_MSG {
				// 	return erros.New("Previous Task not exists")
				// }
				return err
			}
		}
	}
	return nil
}
