package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
)

const JSON_CONTENT_TYPE = "application/json"

var config Conf
var db Db
var logger Logger

func handleSpecialTaskGet(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Content-Type", JSON_CONTENT_TYPE)
	vars := mux.Vars(r)
	idStr := vars["taskId"]
	idInt, err := strconv.Atoi(idStr)
	var id uint
	id = uint(idInt)
	if err != nil {
		error := make(map[string]string)
		error["error"] = "Fail to get taskId from requested path"
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(error)
	}

	var task Task
	task, err = db.SelectOneSpecialTasks(id)
	if err != nil {
		error := make(map[string]string)
		error["error"] = fmt.Sprint(err)
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(error)
	} else {
		json.NewEncoder(w).Encode(task)
	}
}

func handleTasksGet(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Content-Type", JSON_CONTENT_TYPE)
	tasks, err := db.SelectAllTasks()
	if err != nil {
		logger.Error.Println(err)
	}
	err = json.NewEncoder(w).Encode(tasks)
	if err != nil {
		logger.Error.Println(err)
	}
}

func handleTasksPost(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Content-Type", JSON_CONTENT_TYPE)
	var error string
	contentType := r.Header.Get("Content-Type")
	switch contentType {
	case JSON_CONTENT_TYPE:
		var createTask CreateTask
		err := json.NewDecoder(r.Body).Decode(&createTask)
		if err == nil {
			if ValidateCreateTask(&createTask) {
				// create Task
				id, err := db.InsertTask(createTask)
				if err != nil {
					logger.Error.Println(err)
					error = "next task id doesn't exists"
				} else {
					json.NewEncoder(w).Encode(map[string]uint{"created": id})
				}
			} else {
				error = "New Task is not valid"
			}
		} else {
			logger.Error.Println(err)
			error = "Can't parse json body"
		}
	default:
		error = "Content-Type must be 'application/json'"
	}
	if error != "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": error})
	}
}

func handleSpecialTasksPatch(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Content-Type", JSON_CONTENT_TYPE)
	result := make(map[string]string)
	vars := mux.Vars(r)
	idStr := vars["taskId"]
	idInt, err := strconv.Atoi(idStr)
	id := uint(idInt)
	if err == nil {
		contentType := r.Header.Get("Content-Type")
		switch contentType {
		case JSON_CONTENT_TYPE:
			patchObj := make(map[string]interface{})
			err := json.NewDecoder(r.Body).Decode(&patchObj)
			if err == nil {
				title, titleExists := patchObj["title"]
				if titleExists {
					v, ok := title.(string)
					if !ok || v == "" {
						w.WriteHeader(http.StatusBadRequest)
						result["error"] = "title must no be empty"
						titleExists = false
					}
				}
				description, descriptionExists := patchObj["description"]
				if descriptionExists {
					if description == nil {
						description = ""
					}
					if _, ok := description.(string); !ok {
						w.WriteHeader(http.StatusBadRequest)
						result["error"] = "description must be a string"
					}
				}
				location, locationExists := patchObj["location"]
				if locationExists {
					if location == nil {
						location = ""
					}
					if _, ok := location.(string); !ok {
						w.WriteHeader(http.StatusBadRequest)
						result["error"] = "location must be a string"
					}
				}
				date, dateExists := patchObj["date"]
				if dateExists {
					if date == nil {
						date = ""
					}
					if d, ok := date.(string); ok && !ValidateDate(d) {
						w.WriteHeader(http.StatusBadRequest)
						result["error"] = "Date not a valid ISO 8601 string"
						dateExists = false
					}
				}

				time, timeExists := patchObj["time"]
				if timeExists {
					if time == nil {
						time = ""
					}
					if t, ok := time.(string); ok {
						if !ValidateTime(t) {
							w.WriteHeader(http.StatusBadRequest)
							result["error"] = "Time not a valid ISO 8601 string"
							timeExists = false
						}
					} else {
						w.WriteHeader(http.StatusBadRequest)
						result["error"] = "Time not a valid ISO 8601 string"
						timeExists = false
					}
				}
				nextTaskIds, nextTaskIdsExists := patchObj["nextTaskIds"]
				nextTaskIdsArr := make([]uint, 0)
				if nextTaskIdsExists {
					_, ok := nextTaskIds.([]interface{})
					if ok {
						completeOk := true
						for _, item := range nextTaskIds.([]interface{}) {
							_, curOk := item.(float64)
							nextTaskIdsArr = append(nextTaskIdsArr, uint(item.(float64)))
							if !curOk {
								completeOk = false
							}
						}
						if !completeOk {
							w.WriteHeader(http.StatusBadRequest)
							result["error"] = "NextTaskIds must be an integer array"
							nextTaskIdsExists = false
						}
					}
				}
				previousTaskIds, previousTaskIdsExists := patchObj["previousTaskIds"]
				previousTaskIdsArr := make([]uint, 0)
				if previousTaskIdsExists {
					_, ok := previousTaskIds.([]interface{})
					if ok {
						completeOk := true
						for _, item := range previousTaskIds.([]interface{}) {
							_, curOk := item.(float64)
							previousTaskIdsArr = append(previousTaskIdsArr, uint(item.(float64)))
							if !curOk {
								completeOk = false
							}
						}
						if !completeOk {
							w.WriteHeader(http.StatusBadRequest)
							result["error"] = "PreviousTaskIds must be an integer array"
							previousTaskIdsExists = false
						}
					}
				}
				_, containErrors := result["error"]
				if !containErrors {
					// PATCH task
					patchTask := CreateTask{}
					patchKeys := make([]string, 0)
					if titleExists {
						patchTask.Title = title.(string)
						patchKeys = append(patchKeys, "title")
					}
					if descriptionExists {
						patchTask.Description = description.(string)
						patchKeys = append(patchKeys, "description")
					}
					if locationExists {
						patchTask.Location = location.(string)
						patchKeys = append(patchKeys, "location")
					}
					if dateExists {
						patchTask.Date = date.(string)
						patchKeys = append(patchKeys, "date")
					}
					if timeExists {
						patchTask.Time = time.(string)
						patchKeys = append(patchKeys, "time")
					}
					if nextTaskIdsExists {
						patchTask.NextTaskIds = nextTaskIdsArr
						patchKeys = append(patchKeys, "nextTaskIds")
					}
					if previousTaskIdsExists {
						patchTask.PreviousTaskIds = previousTaskIdsArr
						patchKeys = append(patchKeys, "previousTaskIds")
					}
					err := db.UpdateTask(id, patchTask, patchKeys)
					if err != nil {
						logger.Error.Println(err)
						if strings.Contains(err.Error(), "not found to update") {
							w.WriteHeader(http.StatusNotFound)
						} else {
							w.WriteHeader(http.StatusInternalServerError)
						}
						result["error"] = err.Error()
					}
				}

			} else {
				logger.Error.Println(err)
				w.WriteHeader(http.StatusBadRequest)
				result["error"] = "Can't parse json body"
			}
		default:
			w.WriteHeader(http.StatusBadRequest)
			result["error"] = "Content-Type must be 'application/json'"
		}
	} else {
		result["error"] = "Fail to get taskId from requested path"
		w.WriteHeader(http.StatusNotFound)
	}
	if _, ok := result["error"]; ok {
		json.NewEncoder(w).Encode(result)
	}
}

func handleSpecialTasksDelete(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["taskId"]
	idInt, err := strconv.Atoi(idStr)
	var id uint
	id = uint(idInt)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).
			Encode(map[string]string{"error": "Fail to get taskId from requested path"})
	}

	err = db.DeleteTask(id)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
	}
}

func main() {
	logger.Init()
	err := config.readConfig()
	if err != nil {
		logger.Error.Fatalln(err)
	}
	err = db.Connect(config)
	if err != nil {
		logger.Error.Fatalln(err)
	}
	defer db.Disconnect()

	router := mux.NewRouter()

	// Use API base Path for all routes
	apiRouter := router.PathPrefix(config.Server.ApiPath).Subrouter()
	// CORS middleware
	apiRouter.Use(func(handler http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Add("Access-Control-Allow-Origin", "*")
			w.Header().Add("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE")
			w.Header().Add("Access-Control-Allow-Headers", "Content-Type")
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			handler.ServeHTTP(w, r)
		})
	})

	// get all tasks
	apiRouter.HandleFunc("/tasks", handleTasksGet).Methods("GET")
	// Create a new Task
	apiRouter.HandleFunc("/tasks", handleTasksPost).Methods("POST", "OPTIONS")
	// get a speical task by an id
	apiRouter.HandleFunc("/tasks/{taskId}", handleSpecialTaskGet).Methods("GET")
	// Update a path
	apiRouter.HandleFunc("/tasks/{taskId}", handleSpecialTasksPatch).Methods("PATCH", "OPTIONS")
	// Delete a task
	apiRouter.HandleFunc("/tasks/{taskId}", handleSpecialTasksDelete).Methods("DELETE", "OPTIONS")

	addr := fmt.Sprintf("%s:%d", config.Server.Domain, config.Server.Port)
	srv := &http.Server{
		Handler:      router,
		Addr:         addr,
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}
	logger.Error.Fatal(srv.ListenAndServe())
}
