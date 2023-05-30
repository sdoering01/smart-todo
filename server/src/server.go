package main

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"golang.org/x/crypto/argon2"
)

const JSON_CONTENT_TYPE = "application/json"

var config Conf
var db Db
var logger Logger
var tokenUserMap map[string]string

func handleSpecialTaskGet(w http.ResponseWriter, r *http.Request) {
	user := r.Header.Get("username")
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
	task, err = db.SelectOneSpecialTasks(id, user)
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
	user := r.Header.Get("username")
	w.Header().Add("Content-Type", JSON_CONTENT_TYPE)
	tasks, err := db.SelectAllTasks(user)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		logger.Error.Println(err)
	} else {
		json.NewEncoder(w).Encode(tasks)
	}
}

func handleTasksPost(w http.ResponseWriter, r *http.Request) {
	user := r.Header.Get("username")
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
				id, err := db.InsertTask(createTask, user)
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
	user := r.Header.Get("username")
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

	err = db.DeleteTask(id, user)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
	}
}

func writeError(w http.ResponseWriter, error string, errorCode int) {
	w.WriteHeader(errorCode)
	json.NewEncoder(w).Encode(map[string]string{"error": error})
}

func handleRegister(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Content-Type", JSON_CONTENT_TYPE)
	if r.Header.Get("Content-Type") != JSON_CONTENT_TYPE {
		writeError(w, "Content-Type must be 'application/json'", http.StatusBadRequest)
		return
	}
	registerObj := make(map[string]string)
	err := json.NewDecoder(r.Body).Decode(&registerObj)
	if err != nil {
		writeError(w, "fail to parse json body", http.StatusBadRequest)
		return
	}
	username, usernameExists := registerObj["username"]
	fullname, fullnameExists := registerObj["fullname"]
	email, emailExists := registerObj["email"]
	password, passwordExists := registerObj["password"]
	if !usernameExists {
		writeError(w, "request must be contains an username", http.StatusBadRequest)
		return
	}
	if usernameExists && username == "" {
		writeError(w, "username must not be emtpy", http.StatusBadRequest)
		return
	}
	if !fullnameExists {
		writeError(w, "request must be contains a fullname", http.StatusBadRequest)
		return
	}
	if fullnameExists && fullname == "" {
		writeError(w, "fullname must not be emtpy", http.StatusBadRequest)
		return
	}
	if !emailExists {
		writeError(w, "request must be contains an email", http.StatusBadRequest)
		return
	}
	if emailExists && email == "" {
		writeError(w, "email must not be emtpy", http.StatusBadRequest)
		return
	}
	if !passwordExists {
		writeError(w, "request must be contains a password", http.StatusBadRequest)
		return
	}
	if passwordExists && password == "" {
		writeError(w, "password must not be emtpy", http.StatusBadRequest)
		return
	}
	salt, err := getSalt(10)
	if err != nil {
		logger.Error.Println(err)
		writeError(w, "failed to generate password salt", http.StatusInternalServerError)
		return
	}
	hashedPasswd := getHashedPasswd([]byte(password), salt)
	user := User{username, fullname, email, hashedPasswd, salt}
	err = db.insertUser(user)
	if err != nil {
		writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	logger.Info.Printf("Register user %v\n", username)
	json.NewEncoder(w).Encode(map[string]string{"message": fmt.Sprintf("register %v successfull", username)})

}

func handleLogin(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Content-Type", JSON_CONTENT_TYPE)
	if r.Header.Get("Content-Type") != JSON_CONTENT_TYPE {
		writeError(w, "Content-Type must be 'application/json'", http.StatusBadRequest)
		return
	}
	registerObj := make(map[string]string)
	err := json.NewDecoder(r.Body).Decode(&registerObj)
	if err != nil {
		writeError(w, "fail to parse json body", http.StatusBadRequest)
		return
	}
	username, usernameExists := registerObj["username"]
	password, passwordExists := registerObj["password"]
	if !usernameExists {
		writeError(w, "request must be contains an username", http.StatusBadRequest)
		return
	}
	if usernameExists && username == "" {
		writeError(w, "username must not be emtpy", http.StatusBadRequest)
		return
	}
	if !passwordExists {
		writeError(w, "request must be contains a password", http.StatusBadRequest)
		return
	}
	if passwordExists && password == "" {
		writeError(w, "password must not be emtpy", http.StatusBadRequest)
		return
	}
	user, err := db.getUser(username)
	if err != nil {
		logger.Error.Println(err)
		logger.Info.Println("Log in failed. ")
		writeError(w, "Log in failed. Wrong credentials", http.StatusUnauthorized)
		return
	}
	hashedPasswd := getHashedPasswd([]byte(password), user.Salt)
	if bytes.Equal(user.Password, hashedPasswd) {
		logger.Info.Printf("Logged in as %v", username)
		token, err := getSalt(32)
		if err != nil {
			writeError(w, fmt.Sprintf("fail to get token: %v", err.Error()), http.StatusInternalServerError)
		}
		tokenStr := hex.EncodeToString(token)
		tokenUserMap[tokenStr] = username
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Logged in successful",
			"token":   tokenStr,
		})
	} else {
		logger.Info.Println("Log in failed. ")
		writeError(w, "Log in failed. Wrong credentials", http.StatusUnauthorized)
		return
	}
}

func getHashedPasswd(password, salt []byte) []byte {
	return argon2.Key(password, salt, 3, 32*1024, 4, 32)
}

func getSalt(size int) ([]byte, error) {
	b := make([]byte, size)
	_, err := rand.Read(b)
	return b, err
}

func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		logger.Info.Println(r.RequestURI)
		autorization := r.Header.Get("Authorization")
		if len(autorization) == 0 {
			logger.Error.Println("no authorization given")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "no authorization given"})
		} else {
			logger.Info.Println(autorization)
			token := strings.Split(autorization, " ")
			if len(token) == 2 && token[0] == "Bearer" {
				token := token[1]
				logger.Info.Println(token)
				user, ok := tokenUserMap[token]
				if ok {
					logger.Info.Printf("user: %v\n", user)
					r.Header.Del("username")
					r.Header.Add("username", user)
					next.ServeHTTP(w, r)
				} else {
					w.WriteHeader(http.StatusUnauthorized)
					json.NewEncoder(w).Encode(map[string]string{"error": "invalid token"})
				}
			} else {
				w.WriteHeader(http.StatusUnauthorized)
				json.NewEncoder(w).Encode(map[string]string{"error": "invalid athorization header"})
			}
		}
	})
}

// CORS
func corsMiddleware(handler http.Handler) http.Handler {
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
	tokenUserMap = config.Debug.TokenMap

	router := mux.NewRouter()

	// router for endpoints which manges the users
	userManagementRouter := router.PathPrefix(config.Server.ApiPath).Subrouter()

	userManagementRouter.Use(corsMiddleware)

	// register user
	userManagementRouter.HandleFunc("/register", handleRegister).Methods("POST", "OPTIONS")
	// login
	userManagementRouter.HandleFunc("/login", handleLogin).Methods("POST", "OPTIONS")

	// Use API base Path for all routes
	apiRouter := router.PathPrefix(config.Server.ApiPath).Subrouter()
	// CORS middleware
	apiRouter.Use(corsMiddleware)

	// Authentifiaction middleware
	apiRouter.Use(authMiddleware)

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
