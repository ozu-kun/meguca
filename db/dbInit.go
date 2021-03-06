/*
 Initialises and loads RethinkDB
*/

package db

import (
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/bakape/meguca/config"
	"github.com/bakape/meguca/util"
	r "github.com/dancannon/gorethink"
)

const dbVersion = 11

var (
	// Address of the RethinkDB cluster instance to connect to
	Address = "localhost:28015"

	// DBName is the name of the database to use
	DBName = "meguca"

	// RSession exports the RethinkDB connection session. Used globally by the
	// entire server.
	RSession *r.Session

	// AllTables are all tables needed for meguca operation
	AllTables = [...]string{"main", "threads", "images", "accounts", "boards"}
)

// Document is a eneric RethinkDB Document. For DRY-ness.
type Document struct {
	ID string `gorethink:"id"`
}

// Central global information document
type infoDocument struct {
	Document
	DBVersion int `gorethink:"dbVersion"`

	// Is incremented on each new post. Ensures post number uniqueness
	PostCtr int64 `gorethink:"postCtr"`
}

// ConfigDocument holds the global server configurations
type ConfigDocument struct {
	Document
	config.Configs
}

// LoadDB establishes connections to RethinkDB and Redis and bootstraps both
// databases, if not yet done.
func LoadDB() (err error) {
	if err := Connect(); err != nil {
		return err
	}

	var isCreated bool
	err = One(r.DBList().Contains(DBName), &isCreated)
	if err != nil {
		return util.WrapError("error checking, if database exists", err)
	}
	if isCreated {
		RSession.Use(DBName)
		if err := verifyDBVersion(); err != nil {
			return err
		}
	} else if err := InitDB(); err != nil {
		return err
	}

	go runCleanupTasks()
	return loadConfigs()
}

// Connect establishes a connection to RethinkDB. Address passed separately for
// easier testing.
func Connect() (err error) {
	RSession, err = r.Connect(r.ConnectOpts{Address: Address})
	if err != nil {
		err = util.WrapError("error connecting to RethinkDB", err)
	}
	return
}

// Confirm database verion is compatible, if not refuse to start, so we don't
// mess up the DB irreversably.
func verifyDBVersion() error {
	var version int
	err := One(GetMain("info").Field("dbVersion"), &version)
	if err != nil {
		return util.WrapError("error reading database version", err)
	}
	if version != dbVersion {
		return fmt.Errorf(
			"Incompatible RethinkDB database version: %d. "+
				"See docs/migration.md",
			version,
		)
	}
	return nil
}

// InitDB initialize a rethinkDB database
func InitDB() error {
	log.Printf("initialising database '%s'", DBName)
	if err := Write(r.DBCreate(DBName)); err != nil {
		return util.WrapError("error creating database", err)
	}

	RSession.Use(DBName)

	if err := CreateTables(); err != nil {
		return err
	}

	main := [...]interface{}{
		infoDocument{Document{"info"}, dbVersion, 0},

		// History aka progress counters of boards, that get incremented on
		// post and thread creation
		Document{"boardCtrs"},

		ConfigDocument{
			Document{"config"},
			config.Defaults,
		},
	}
	if err := Write(r.Table("main").Insert(main)); err != nil {
		return util.WrapError("error initializing database", err)
	}

	if err := createAdminAccount(); err != nil {
		return err
	}

	return CreateIndeces()
}

// CreateTables creates all tables needed for meguca operation
func CreateTables() error {
	fns := make([]func() error, 0, len(AllTables))

	for _, table := range AllTables {
		if table == "images" {
			continue
		}
		fns = append(fns, createTable(table))
	}

	fns = append(fns, func() error {
		return Write(r.TableCreate("images", r.TableCreateOpts{
			PrimaryKey: "SHA1",
		}))
	})

	return util.Waterfall(fns)
}

func createTable(name string) func() error {
	return func() error {
		return Write(r.TableCreate(name))
	}
}

// CreateIndeces create secondary indeces for faster table queries
func CreateIndeces() error {
	fns := []func() error{
		func() error {
			return Write(r.Table("threads").IndexCreate("board"))
		},

		// For quick post parent thread lookups
		func() error {
			q := r.Table("threads").
				IndexCreateFunc(
					"post",
					func(thread r.Term) r.Term {
						return thread.
							Field("posts").
							Keys().
							Map(func(id r.Term) r.Term {
								return id.CoerceTo("number")
							})
					},
					r.IndexCreateOpts{Multi: true},
				)
			return Write(q)
		},
	}

	// Make sure all indeces are ready to avoid the race condition of and index
	// being accessed before its full creation.
	for _, table := range AllTables {
		fns = append(fns, waitForIndex(table))
	}

	return util.Waterfall(fns)
}

func waitForIndex(table string) func() error {
	return func() error {
		return Exec(r.Table(table).IndexWait())
	}
}

// UniqueDBName returns a unique datatabase name. Needed so multiple concurent
// `go test` don't clash in the same database.
func UniqueDBName() string {
	return "meguca_tests_" + strconv.FormatInt(time.Now().UnixNano(), 10)
}

// Create the admin account and write it to the database
func createAdminAccount() error {
	hash, err := util.PasswordHash("admin", "password")
	if err != nil {
		return err
	}
	return RegisterAccount("admin", hash)
}
