package main

import (
	"errors"
	"os"

	"gopkg.in/yaml.v3"
)

type Conf struct {
	Server struct {
		Domain   string `yaml:"domain"`
		Port     int    `yaml:"port"`
		ApiPath  string `yaml:"apiPath"`
		TokenTTL int    `yaml:"tokenTTL"`
	} `yaml:"server"`
	Database struct {
		Domain   string `yaml:"domain"`
		Port     int    `yaml:"port"`
		Username string `yaml:"username"`
		Password string `yaml:"password"`
		Database string `yaml:"database"`
	} `yaml:"database"`
	Debug struct {
		TokenMap map[string]string `yaml:"tokenMap"`
	} `yaml:"debug"`
}

func (conf *Conf) readConfig() error {
	var logger Logger
	logger.Init()
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
		logger.Warning.Println("backend domain not set, use \"localhost\"")
	}
	if conf.Server.Port == 0 {
		conf.Server.Port = 8080
		logger.Warning.Println("backend port not set, use 8080")
	}
	if conf.Server.ApiPath == "" {
		conf.Server.ApiPath = "/api"
		logger.Warning.Println("backend api path not set, use \"/api\"")
	}
	if conf.Database.Domain == "" {
		conf.Database.Domain = "localhost"
		logger.Warning.Println("database domain not set, use \"localhost\"")
	}
	if conf.Database.Port == 0 {
		conf.Database.Port = 5432
		logger.Warning.Println("databse port not set, use 5432")
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
	if len(conf.Debug.TokenMap) > 0 {
		logger.Warning.Println(
			"You use an unsecure debug feature. " +
				"The login token for some username will be initial set and " +
				"some one can use this without knowing the password. " +
				"A normal login will override the initial token",
		)
	}
	return nil
}

//
// func main() {
// 	var conf Conf
// 	err := conf.readConfig()
// 	if err != nil {
// 		fmt.Println(err)
// 	}
// 	fmt.Println(conf.Debug.TokenMap)
// }
