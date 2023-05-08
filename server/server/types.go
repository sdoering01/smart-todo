package main

import "time"

type Task struct {
	Id          uint   `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Location    string `json:"loaction"`
	Date        string `json:"date"` // yyyy-mm-dd (https://en.wikipedia.org/wiki/ISO_8601)
	Time        string `json:"time"` // hh:mm
	NextTaskIds []uint `json:"nextTaskIds"`
}

// all of Task, but no id
type CreateTask struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Location    string `json:"location"`
	Date        string `json:"date"`
	Time        string `json:"time"`
	NextTaskIds []uint `json:"nextTaskIds"`
}

func ValidateDate(dateStr string) bool {
	valid := false
	if dateStr != "" {
		_, err := time.Parse(time.RFC3339, dateStr+"T00:00:00Z")
		if err == nil {
			valid = true
		}
	} else {
		valid = true
	}
	return valid
}

func ValidateTime(timeStr string) bool {
	valid := false
	if timeStr != "" {
		_, err := time.Parse(time.RFC3339, "2022-07-27T"+timeStr+":00Z")
		if err == nil {
			valid = true
		}
	} else {
		valid = true
	}
	return valid
}

func ValidateCreateTask(createTask *CreateTask) bool {
	return ValidateTask(&Task{
		0,
		createTask.Title,
		createTask.Description,
		createTask.Location,
		createTask.Date,
		createTask.Time,
		createTask.NextTaskIds})
}

func ValidateTask(task *Task) bool {
	if task.Title != "" {
		if ValidateDate(task.Date) {
			if ValidateTime(task.Time) {
				return true
			}
		}
	}
	return false
}
