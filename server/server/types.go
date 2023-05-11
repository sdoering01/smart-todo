package main

import (
	"errors"
	"fmt"
	"log"
	"os"
	"time"
)

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
	Title           string `json:"title"`
	Description     string `json:"description"`
	Location        string `json:"location"`
	Date            string `json:"date"`
	Time            string `json:"time"`
	NextTaskIds     []uint `json:"nextTaskIds"`
	PreviousTaskIds []uint `json:"previousTaskIds"`
}

func (task *CreateTask) GetByKey(key string) (interface{}, bool) {
	if key == "title" {
		return task.Title, true
	} else if key == "description" {
		return task.Description, true
	} else if key == "location" {
		return task.Location, true
	} else if key == "date" {
		return task.Date, true
	} else if key == "time" {
		return task.Time, true
	} else if key == "nextTaskIds" {
		return task.NextTaskIds, true
	} else if key == "previousTaskIds" {
		return task.PreviousTaskIds, true
	} else {
		return nil, false
	}
}

type ArrayAggInt struct {
	Value []uint
	Valid bool
}

func (h *ArrayAggInt) Scan(src any) error {
	arr, ok := src.([]uint8)
	if !ok {
		errorStr := fmt.Sprintf("unsupported Scan, storing driver.Value type %T into type []uint8", src)
		return errors.New(errorStr)
	}
	if string(arr) == "{NULL}" {
		h.Valid = false
		return nil
	}
	arrLen := len(arr)
	value := make([]uint, 0)
	if arr[0] != 123 || arr[arrLen-1] != 125 {
		return errors.New("unsupported Scan, No grouped Value with {}")
	}
	curValueArr := make([]uint, 0)
	for index, item := range arr {
		if item == 44 || index == arrLen-1 {
			var curValue uint = 0
			curValueArrIdx := 0
			for i := len(curValueArr) - 1; i >= 0; i-- {
				v := curValueArr[i]
				var digitFactor uint = uint(curValueArrIdx * 10)
				if digitFactor == 0 {
					digitFactor = 1
				}
				curValue += v * digitFactor
				curValueArrIdx++
			}
			value = append(value, curValue)
			curValueArr = make([]uint, 0)
		}
		if index != 0 && index != arrLen-1 && item >= 48 && item <= 57 {
			curValueArr = append(curValueArr, uint(item-48))
		}
	}
	if len(value) > 0 {
		h.Value = value
		h.Valid = true
	} else {
		h.Valid = false
	}
	return nil
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

type Logger struct {
	Warning *log.Logger
	Info    *log.Logger
	Error   *log.Logger
}

func (logger *Logger) Init() {
	logger.Info = log.New(os.Stderr, "INFO: ", log.Ldate|log.Ltime|log.Lshortfile|log.Lmsgprefix)
	logger.Warning = log.New(os.Stderr, "WARNING: ", log.Ldate|log.Ltime|log.Lshortfile|log.Lmsgprefix)
	logger.Error = log.New(os.Stderr, "ERROR: ", log.Ldate|log.Ltime|log.Lshortfile|log.Lmsgprefix)
}
