package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
)

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
	// func(w http.ResponseWriter, r *http.Request) {
	// 	json.NewEncoder(w).Encode(map[string]bool{"ok": true})
	// })

	srv := &http.Server{
		Handler:      router,
		Addr:         "localhost:8080",
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}
	log.Fatal(srv.ListenAndServe())
}
