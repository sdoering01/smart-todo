package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
)

const JSON_CONTENT_TYPE = "application/json"

func handleSpecialTaskGet(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Content-Type", JSON_CONTENT_TYPE)
	vars := mux.Vars(r)
	idStr := vars["taskId"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		error := make(map[string]string)
		error["error"] = "Fail to get taskId from requested path"
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(error)
	}

	fmt.Printf("TaskId: %d\n", id)
	json.NewEncoder(w).Encode(Task{0, "Tesk 1", "", "", "", "", []uint{}})
}

func handleTasksGet(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Content-Type", JSON_CONTENT_TYPE)
	tasks := []Task{
		{0, "Task 1", "Task 1 Description", "Task 1 Location", "2023-05-06", "18:00", []uint{1}},
		{1, "Task 2", "", "", "", "", []uint{}},
	}
	err := json.NewEncoder(w).Encode(tasks)
	if err != nil {
		fmt.Println(err)
	}
}

func handleTasksPost(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Content-Type", JSON_CONTENT_TYPE)
	result := make(map[string]string)
	contentType := r.Header.Get("Content-Type")
	switch contentType {
	case JSON_CONTENT_TYPE:
		var createTask CreateTask
		err := json.NewDecoder(r.Body).Decode(&createTask)
		if err == nil {
			fmt.Println(createTask)
			if ValidateCreateTask(&createTask) {
				result["created"] = "2"
			} else {
				w.WriteHeader(http.StatusBadRequest)
				result["error"] = "New Task is not valid"
			}
		} else {
			fmt.Println(err)
			w.WriteHeader(http.StatusBadRequest)
			result["error"] = "Can't parse json body"
		}
	default:
		w.WriteHeader(http.StatusBadRequest)
		result["error"] = "Content-Type must be 'application/json'"
	}
	json.NewEncoder(w).Encode(result)
}

func handleSpecialTasksPatch(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Content-Type", JSON_CONTENT_TYPE)
	result := make(map[string]string)
	vars := mux.Vars(r)
	idStr := vars["taskId"]
	id, err := strconv.Atoi(idStr)
	if err == nil {
		fmt.Printf("Change Task %v\n", id)
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
					if _, ok := description.(string); !ok {
						w.WriteHeader(http.StatusBadRequest)
						result["error"] = "description must be a string"
					}
				}
				location, locationExists := patchObj["location"]
				if locationExists {
					if _, ok := location.(string); !ok {
						w.WriteHeader(http.StatusBadRequest)
						result["error"] = "location must be a string"
					}
				}
				date, dateExists := patchObj["date"]
				if dateExists {
					if d, ok := date.(string); ok && !ValidateDate(d) {
						w.WriteHeader(http.StatusBadRequest)
						result["error"] = "Date not a valid ISO 8601 string"
						dateExists = false
					}
				}

				time, timeExists := patchObj["time"]
				if timeExists {
					if t, ok := time.(string); ok && !ValidateTime(t) {
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
				_, containErrors := result["error"]
				if !containErrors {
					// PATCH task
					fmt.Printf("Update Task %v\n", id)
					if titleExists {
						fmt.Printf("New title: %v\n", title.(string))
					}
					if descriptionExists {
						fmt.Printf("New description: %v\n", description.(string))
					}
					if locationExists {
						fmt.Printf("New location: %v\n", location.(string))
					}
					if dateExists {
						fmt.Printf("New date: %v\n", date.(string))
					}
					if timeExists {
						fmt.Printf("New time: %v\n", time.(string))
					}
					if nextTaskIdsExists {
						fmt.Printf("New nextTaskIds: %v\n", nextTaskIdsArr)
					}
				} else {
					fmt.Println(result)
				}

			} else {
				fmt.Println(err)
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
	json.NewEncoder(w).Encode(result)
}

func handleSpecialTasksDelete(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["taskId"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		error := make(map[string]string)
		error["error"] = "Fail to get taskId from requested path"
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(error)
	}

	fmt.Printf("Delete TaskId: %d\n", id)
}

func main() {
	apiPath := "/api"
	router := mux.NewRouter()

	// Use API base Path for all routes
	apiRouter := router.PathPrefix(apiPath).Subrouter()

	// get all tasks
	apiRouter.HandleFunc("/tasks", handleTasksGet).Methods("GET")
	// Create a new Task
	apiRouter.HandleFunc("/tasks", handleTasksPost).Methods("POST")
	// get a speical task by an id
	apiRouter.HandleFunc("/tasks/{taskId}", handleSpecialTaskGet).Methods("GET")
	// Update a path
	apiRouter.HandleFunc("/tasks/{taskId}", handleSpecialTasksPatch).Methods("PATCH")
	// Delete a task
	apiRouter.HandleFunc("/tasks/{taskId}", handleSpecialTasksDelete).Methods("DELETE")

	srv := &http.Server{
		Handler:      router,
		Addr:         "localhost:8080",
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}
	log.Fatal(srv.ListenAndServe())
}
