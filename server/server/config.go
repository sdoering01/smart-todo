package main

import (
	"errors"
	"log"
	"os"

	"gopkg.in/yaml.v3"
)

type Conf struct {
	Server struct {
		Domain  string `yaml:"domain"`
		Port    int    `yaml:"port"`
		ApiPath string `yaml:"apiPath"`
	} `yaml:"server"`
	Database struct {
		Domain   string `yaml:"domain"`
		Port     int    `yaml:"port"`
		Username string `yaml:"username"`
		Password string `yaml:"password"`
		Database string `yaml:"database"`
	} `yaml:"database"`
}

func (conf *Conf) readConfig() error {
	yamlFile, err := os.ReadFile("config.yaml")
	if err != nil {
		return err
	}
	err = yaml.Unmarshal(yamlFile, &conf)
	if err != nil {
		return err
	}
	if conf.Server.Domain == "" {
		conf.Server.Domain = "localhost"
		log.Println("backend domain not set, use \"localhost\"")
	}
	if conf.Server.Port == 0 {
		conf.Server.Port = 8080
		log.Println("backend port not set, use 8080")
	}
	if conf.Server.ApiPath == "" {
		conf.Server.ApiPath = "/api"
		log.Println("backend api path not set, use \"/api\"")
	}
	if conf.Database.Domain == "" {
		conf.Database.Domain = "localhost"
		log.Println("database domain not set, use \"localhost\"")
	}
	if conf.Database.Port == 0 {
		conf.Database.Port = 5432
		log.Println("databse port not set, use 5432")
	}
	if conf.Database.Username == "" {
		return errors.New("database username is not set")
	}
	if conf.Database.Password == "" {
		return errors.New("database password is not set")
	}
	if conf.Database.Database == "" {
		return errors.New("database name is not set")
	}
	return nil
}
