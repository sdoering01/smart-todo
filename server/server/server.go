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

func main() {
	apiPath := "/api"
	router := mux.NewRouter()

	// get all tasks
	router.HandleFunc(apiPath+"/tasks", handleTasksGet).Methods("GET")
	// Create a new Task
	router.HandleFunc(apiPath+"/tasks", handleTasksPost).Methods("POST")
	// get a speical task by an id
	router.HandleFunc(apiPath+"/tasks/{taskId}", handleSpecialTaskGet).Methods("GET")

	srv := &http.Server{
		Handler:      router,
		Addr:         "localhost:8080",
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}
	log.Fatal(srv.ListenAndServe())
}
