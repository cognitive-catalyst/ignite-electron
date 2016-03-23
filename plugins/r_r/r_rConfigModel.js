/* jshint esnext: true, node: true, asi: true, sub:true */
(function() {
  'use strict'
  const $ = require('../../js/jquery-2.1.4.min.js')
  const project = require('../../js/project')
  const plugin = require('./plugin')
  const Client = require('cloudfoundry-client')
  const remote = require('electron').remote
  const dialog = remote.dialog
  
  const createClient = (context) => {
	  var modifiedClient =  new Client({
	      protocol: 'https:',
	      host: context.project.bluemix.apiEndpoint,
	      email: context.project.bluemix.uid,
	      password: context.project.bluemix.pwd
	  });
	  
	  //poor practice - did this to avoid creating my own npm
	  var cfRequest = require('../../node_modules/cloudfoundry-client/lib/request.js')('https:', context.project.bluemix.apiEndpoint, 
			  null, context.project.bluemix.uid, context.project.bluemix.pwd);
	  var Collections = require('../../node_modules/cloudfoundry-client/lib/collections.js')
	  var collections = new Collections(cfRequest);

	  modifiedClient.serviceInstances = collections.create('service_instances', {
		  name: { type: 'string' },
	      space_guid: { type: 'string' },
	      service_plan_guid: { type: 'string' },
	  }, [ 'service_keys' ]);
	  
	  modifiedClient.serviceInstances.getAll = function(callback) {
		  this.get(function (err, result) {
			  if (err) {
				  return callback(err);
			  }
			  return callback(null, result)
		  }, callback);	
	  };
	  
	  modifiedClient.serviceKeys = collections.create('service_keys', {
	        service_instance_guid: { type: 'string' },
	        name: { type: 'string' },
	  });
	  return modifiedClient;
  }

  const validateBluemixCredentials = (context, cb) => {
    populateOrganizations(context, (err, orgs) => {
      if (err) {
        cb(err, null);
      } else {
        cb(null, context)
      }
    })
  }

  const populateOrganizations = (context, cb) => {
    context.client.organizations
      .get((err, orgs) => {
        if (err) {
          cb(err, null)
        } else {
          cb(null, orgs)
        }
      })
  }

  const getSpaces = (context, cb) => {
    context.client.spaces
      .get({
        organization_guid: context.project.org.guid
      }, (err, spaces) => {
        if (err) {
          cb(err, null)
        } else {
          cb(null, spaces)
        }
      })
  }
  
  const getR_R = (context, cb) => {
    context.client.services
      .getByName('retrieve_and_rank', (err, services) => {
        if (err) {
          cb(err, null)
        } else {
          cb(null, services)
        }
      })
  }

  const getR_RInstances = (context, cb) => {
	    context.client.serviceInstances
	      .getAll((err, services) => {
	        if (err) {
	          cb(err, null)
	        } else {
	          cb(null, services)
	        }
	      })
	  }
  
  const createR_R = (context, cb) => {
    context.client.serviceInstances
      .create({
        name: context.project.service.r_r.name,
        service_plan_guid: context.project.service.r_r.plan.guid,
        space_guid: context.project.space.guid
      }, (err, service) => {
        if (err) {
          cb(err, null)
        } else {
          cb(null, service)
        }
      })
  }

  const createKey = (context, cb) => {
    context.client.serviceKeys
      .create({
        name: context.project.service.r_r.key.name,
        service_instance_guid: context.project.service.r_r.guid
      }, (err, key) => {
        if (err) {
          cb(err, null)
        } else {
          cb(null, key)
        }
      })
  }

  const getKey = (context, cb) => {
	  context.client.serviceKeys
      .get({
        service_instance_guid: context.project.service.r_r.plan['guid']
      }, (err, key) => {
        if (err) {
          cb(err, null)
        } else {
          if(key.length < 1){
        	  createKey(context, (err, key) => {
        		  if(err){
        			  cb(err, null)
        		  } else {
        			  var a = []
        			  a.push(key);
        			  cb(null, a)
        		  }
        	  })
          }else {
        	  cb(null, key)
          }
        }
      })
  }

  module.exports = function() {
    let self = this
    self.context = {}
    self.context.project = {}
    self.context.project.bluemix = {}


    self.validateCredentials = () => {
      self.context.project.bluemix['uid'] = $("#bmemail").val()
      self.context.project.bluemix['pwd'] = $("#bmpwd").val()
      self.context.project.bluemix['apiEndpoint'] = $("#apiEndpoint").val()

      self.context['client'] = createClient(self.context)

      validateBluemixCredentials(self.context, (err, vars) => {
        if (err) {
          dialog.showErrorBox("Bluemix Validation", err.message.description)
        } else {
          self.advanceToTarget()
          populateOrganizations(self.context, (err, orgs) => {
            if (err) {
              dialog.showErrorBox("Organization Loading Error", err.message.description)
            } else {
              $('#bmOrg').empty()
              $('#bmOrg').append($('<option />').text('Select Organization').prop('selected', true))
              orgs.forEach((org) => {
                $('#bmOrg').append($('<option />').val(org.metadata.guid).text(org.entity.name))
              })
            }
          })
        }
      })
    }

    self.validateOrg = () => {
      self.context.project.org = {}
      self.context.project.org['guid'] = $('#bmOrg').find(":selected").val()
      self.context.project.org['name'] = $('#bmOrg').find(":selected").text()

      getSpaces(self.context, (err, spaces) => {
        if (err) {
          dialog.showErrorBox("Space Loading Error", err.message.description)
        } else {
          $('#bmSpace').empty()
          $('#bmSpace').append($('<option />').text('Select Spaces').prop('selected', true))
          spaces.forEach((space) => {
            $('#bmSpace').append($('<option />').val(space.metadata.guid).text(space.entity.name))
          })
        }
      })
    }

    self.validateSpace = () => {
      self.context.project.space = {}
      self.context.project.space['guid'] = $('#bmSpace').find(":selected").val()
      self.context.project.space['name'] = $('#bmSpace').find(":selected").text()

      self.advanceToR_R()
      getR_RInstances(self.context, (err, services) => {
        if(err) {
        	dialog.showErrorBox("Existing Services Loading Error", err.message.description)
        } else {
          $('#existingRR').empty() 
          $('#existingRR').append($('<option />').text('Select Service').val(false).prop('selected', true))
          services.forEach((service) => {
            $('#existingRR').append($('<option />').val(service.metadata.guid).text(service.entity.name))
          })
          $("#existingRR").html($("#existingRR option").sort(function (a, b) {
        	  return a.text == b.text ? 0 : a.text < b.text ? -1 : 1
          }))
        }        
      })
      
      getR_R(self.context, (err, service) => {
        if (err) {
          dialog.showErrorBox("Service Loading Error", err.message.description)
        } else {
          self.context.r_r = {}
          self.context.r_r['guid'] = service.metadata.guid
          service.servicePlans.get((err, plans) => {
            $('#plans').empty()
            $('#plans').append($('<option />').text('Select Plan').val(false).prop('selected', true))
            plans.forEach((plan) => {
              $('#plans').append($('<option />').val(plan.metadata.guid).text(plan.entity.name))
            })
          })
        }
      })
    }

    self.useR_RService = () => {
        self.context.project.service = {}
        self.context.project.service.r_r = {}
        self.context.project.service.r_r.plan = {}
        self.context.project.service.r_r.plan['name'] = $('#existingRR option:selected').text()
        self.context.project.service.r_r.plan['guid'] = $('#existingRR option:selected').val()
        self.context.project.service.r_r['guid'] = $('#existingRR option:selected').val()
        self.context.project.service.r_r.key = {}
        self.context.project.service.r_r.key['name'] = $('#existingRR option:selected').text() + '.IgniteKey'
        
        getKey(self.context, (err, key) => {
          if (err) {
            dialog.showErrorBox("Create Service Validation", err.message.description)
          } else {
            self.context.project.service.r_r.key['username'] = key[0].entity.credentials.username
            self.context.project.service.r_r.key['password'] = key[0].entity.credentials.password
            self.advanceToProject()
          }
        })
    }
    
    self.createR_RService = () => {
      self.context.project.service = {}
      self.context.project.service.r_r = {}
      self.context.project.service.r_r['name'] = $('#r_rName').val()

      self.context.project.service.r_r.plan = {}
      self.context.project.service.r_r.plan['name'] = $('#plans option:selected').text()
      self.context.project.service.r_r.plan['guid'] = $('#plans option:selected').val()

      if (self.context.project.service.r_r.name === '') {
        dialog.showErrorBox("Create Service Validation", "Service Name is not set")
        return
      }
      if (self.context.project.service.r_r.plan.guid === false) {
        dialog.showErrorBox("Create Service Validation", "Select a service plan")
        return
      }

      createR_R(self.context, (err, service) => {
        if (err) {
          dialog.showErrorBox("Create Service Validation", err.message.description)
        } else {
          self.context.project.service.r_r['guid'] = service.metadata.guid
          self.context.project.service.r_r.key = {}
          self.context.project.service.r_r.key['name'] = self.context.project.service.r_r.name + '.IgniteKey'

          createKey(self.context, (err, key) => {
            if (err) {
              dialog.showErrorBox("Create Service Validation", err.message.description)
            } else {
              self.context.project.service.r_r.key['guid'] = key.metadata.guid
              self.context.project.service.r_r.key['username'] = key.entity.credentials.username
              self.context.project.service.r_r.key['password'] = key.entity.credentials.password
              self.advanceToProject()
            }
          })
        }
      })
    }

    self.validateProject = () => {
      self.context.project['name'] = $('#projectName').val()
      self.context.project.config = plugin

      if (!self.validateText(self.context.project.name, "Please enter a valid project name") ||
        !self.validateText(self.context.project.bluemix.uid, "Please validate your Bluemix Credentials") ||
        !self.validateText(self.context.project.bluemix.pwd, "Please validate your Bluemix Credentials") ||
        !self.validateText(self.context.project.bluemix.apiEndpoint, "Please validate your Bluemix Credentials") ||
        !self.validateText(self.context.project.service.r_r.key.username, "Please create an R&R instance") ||
        !self.validateText(self.context.project.service.r_r.key.password, "Please create an R&R instance") ||
        !self.validateText(self.context.project.service.r_r.guid, "Please create an R&R instance")
      ) {
        return
      }

      self.context.project.bluemix.uid = "";
      self.context.project.bluemix.pwd = "";
      
      project.createProject(self.context.project,['data','train','history'],(err,newProject) =>{
        if(err) {
          console.error(err)
          dialog.showErrorBox("Error Creating Project", err)
        }
      })
    }

    self.validateText=(src, message)=>{
      if (src === null || src === '') {
        dialog.showErrorBox("Project Validation", message)
        return false
      }
      return true
    }

    self.advanceToTarget = () => {
      $('#bluemixConfigurationTab').removeClass('in')
      $('#targetConfigurationTab').addClass('in')
    }

    self.advanceToR_R = () => {
      $('#targetConfigurationTab').removeClass('in')
      $('#r_rConfigurationTab').addClass('in')
    }

    self.advanceToProject = () => {
      $('#r_rConfigurationTab').removeClass('in')
      $('#projectConfigurationTab').addClass('in')
    }
  }
})()
