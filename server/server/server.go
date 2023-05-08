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

func handleSpecialTaskGet(w http.ResponseWriter, r *http.Request) {
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
	tasks := []Task{
		{0, "Task 1", "Task 1 Description", "Task 1 Location", "2023-05-06", "18:00", []uint{1}},
		{1, "Task 2", "", "", "", "", []uint{}},
	}
	err := json.NewEncoder(w).Encode(tasks)
	if err != nil {
		fmt.Println(err)
	}
}

func main() {
	apiPath := "/api"
	router := mux.NewRouter()

	router.HandleFunc(apiPath+"/tasks", handleTasksGet).Methods("GET")
	router.HandleFunc(apiPath+"/tasks/{taskId}", handleSpecialTaskGet).Methods("GET")

	srv := &http.Server{
		Handler:      router,
		Addr:         "localhost:8080",
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}
	log.Fatal(srv.ListenAndServe())
}
