/* jshint esnext: true, node: true, asi: true, sub:true */
(function() {
  'use strict'
  const path = require('path')
  const mkdirp = require('mkdirp')
  const Datastore = require('nedb')
  const BrowserWindow = require('electron').remote.BrowserWindow;
  const projectdb = new Datastore({
    filename: path.join(path.resolve('.'), 'data', 'db', '.projectdb'),
    autoload: true
  })
  const projectDatabases = {}

  function Project() {


    const getProjectDatabase = (path,cb) => {
      if (!projectDatabases[path]) {
        projectDatabases[path] = new Datastore({
          filename: path,
          autoload: true
        })
      }
      cb(null, projectDatabases[path])
    }

    const createDB = (project, cb) => {
      project['type'] = 'project'
      projectdb.insert(project, cb)
    }

    const removeDB = (project, cb) => {
        projectdb.remove({ _id: project}, cb)
    }
    
    const getProjectsDB = (cb) => {
      projectdb.find({
          type: 'project'
        })
        .sort({
          name: 1
        })
        .exec(cb)
    }

    const getProjectByID = (id, cb) => {

      projectdb.findOne({
        _id: id
      }, cb)
    }

    const createFS = (project, directories, cb) => {
      project['dir'] = path.join(path.resolve('.'), 'data', 'projects', project.name)
      mkdirp(project.dir, (err) => {
        if (err) {
          cb(err, null)
        } else {
          directories.forEach((entry) => {
            mkdirp(path.join(path.resolve('.'), 'data', 'projects', project.name, entry), (err) => {
              cb(err, null)
            })
          })
          cb(null, project)
        }
      })
    }
    
    const getProjectDB = (projectID, dbID, cb) => {
       getProjectByID(projectID, (err, project) => {
        if (err) {
          cb(err, null)
        } else {
          return getProjectDatabase(path.join(path.resolve('.'), 'data', 'projects', project.name, '.' + dbID),cb)
        }
      })
    }

    return {
      ensureIndex: (projectID, dbID, options) => {
        getProjectDB(projectID, dbID, (err, db)=> {
          db.ensureIndex(options, function (err) {console.log(err)});
        })
      },
      
      createProject: (project, directories, cb) => {
        createDB(project, (err, updatedProject) => {
          if (err) {
            cb(err, null)
          } else {
            createFS(project, directories, (err, newProject) => {
              if (err) {
                cb(err, null)
              } else {
            	BrowserWindow.getFocusedWindow().webContents.send('project-update')
                cb(err, newProject)
              }
            })
          }
        })
      },
      
      deleteProject: (projectID, directories, cb) => {
    	  getProjectByID(projectID, (err, project) => {
    		  console.log(project._id);
    		  removeDB(project._id, (err, updatedProject) => {
    			  BrowserWindow.getFocusedWindow().webContents.send('project-update')
    			  console.log("Project folders are not currently being deleted. Please remove the appropiate folders in data/projects.")
    		  })
    	  })
      },

      getProjects: (cb) => {
        getProjectsDB(cb)
      },

      getProjectByID: (id, cb) => {
        getProjectByID(id, cb)
      },

      fetchFromProjectDB: (projectID, dbID, filter, cb) => {
        getProjectDB(projectID, dbID, (err,db)=>{
          db.findOne(filter, cb)
        })
      },

      selectAndSortFromProjectDB: (projectID, dbID, sortFilter, cb) => {
        getProjectDB(projectID, dbID, (err,db)=>{
          db.find({}).sort(sortFilter).exec(cb)
        })
      },

      insertProjectDB: (projectID, dbID, record, cb) => {
        getProjectDB(projectID, dbID, (err,db)=>{
          db.insert(record, cb)
        })
      },

      updateProjectDB: (projectID, dbID, filter, record, cb) => {
        getProjectDB(projectID, dbID, (err,db)=>{
          db.update(filter, record, {
            upsert: true,
            multi: false
          }, (error, numReplacted, upsert) => {
            cb(error, upsert)
          })
        })
      },

      fetchFromProjectDB: (projectID, dbID, filter, cb) => {
        getProjectDB(projectID, dbID, (err,db)=>{
          db.find(filter, cb)
        })
      }
    }
  }

  module.exports = new Project()
})()
