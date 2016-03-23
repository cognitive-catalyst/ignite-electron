/* jshint esnext: true, node: true, asi: true, sub:true */
(function() {
  'use strict'
  const $ = window.$
  const project = require('../../js/project')
  const plugin = require('./plugin')
  const rrReqs = require('./js/rrRequests')
  const Client = require('cloudfoundry-client')
  const remote = require('electron').remote
  const dialog = remote.dialog
  const utility = require('./js/utility')
  const fs = require('fs');
  const csv = require('csv');
  
  function cluster(clusterObject) {
	  this.name = clusterObject.cluster_name;
	  this.size = clusterObject['cluster_size'];
	  this.id = clusterObject['solr_cluster_id'];
	  this.status = clusterObject['solr_cluster_status'];
  }
  
  function ranker(rankerObject) {
	  this.name = rankerObject.name;
	  this.id = rankerObject.ranker_id;
	  this.url = rankerObject.url;
	  this.date = rankerObject.created;
  }
  
  function ButtonFactory(classString, value, clickListener){
	  var button = document.createElement("input");
	  button.type = "button";
	  button.className = classString;
	  if(value != null)
		  button.value = value;
      button.addEventListener('click', clickListener);
      return button;
  }
  
  function ParaFactory(value){
	  var para = document.createElement("p");
	  var node = document.createTextNode(value);
	  para.appendChild(node);
	  return para
  }
  
  function ListItemFactory(value){
	  var list = document.createElement("li");
	  var link = document.createElement("a");
	  var text = document.createTextNode(value);
	  link.appendChild(text);
	  list.appendChild(link);
	  return list;
  }
  
  function config(configObject){
	  this.name = configObject;
  }

  module.exports = function() {
    let self = this;
    let training = null;
    var rrRequests = new rrReqs.rrRequests()
    var utilities = new utility.utility()
    var clusterList = [];
    var clusterSelected = null;
    var configSelected = null;
    var collectionSelected = null;
    var rankerSelected = null;
    var configList = [];
    var collectionList = [];
    var rankerList = [];
   	var parser = csv.parse();
   	var csvStringify = csv.stringify;
   	var trainingCluster = null;
   	var trainingCollection = null;
   	var trainingRanker = null
   	var csvStepper;
   	var originalAnswer;
   	var fullAnswer;
   	var currentQuery;
      	
   	var csvOutput = [];
   	parser.on('readable', function(){
   		var record;
   		csvStepper = 0;
   		while(record = parser.read()){
   			csvOutput.push(record[0]);
   		}
   	});
   	
   	parser.on('error', function(err){
   		console.log(err.message);
   	});
   	
   	parser.on('finish', function(){
   		var queryField = document.getElementById("gtQueryText");
   		queryField.innerHTML = csvOutput[csvStepper];
   		submitButton.value = "Start";
   		submitButton.removeEventListener('click', askQuestion);
   		submitButton.addEventListener('click', startAskingQuestions);
   		submitButton.disabled = false;
   	});
   	
   	var startAskingQuestions = () => {
   		submitButton.disabled = true;
    	askQuestion(function(){
    		submitButton.value = "Next";
       		submitButton.removeEventListener('click', startAskingQuestions);
       		submitButton.addEventListener('click', nextQuestion);
    		if(csvStepper < csvOutput.length-1)
    			submitButton.disabled = false;
    	});
   	}

    var nextQuestion = () => {
    	saveToCSV();
   		var queryField = document.getElementById("gtQueryText");
   		submitButton.disabled = true;
   		if(queryField.innerHTML == currentQuery){
   			queryField.innerHTML = csvOutput[++csvStepper];
   		}
    	askQuestion(function(){
    		if(csvStepper < csvOutput.length-1)
    			submitButton.disabled = false;
    	});
   		
    };
    
    var setTrainingCluster = (selText) => {
    	if(clusterList != null){
    		clusterList.forEach ( function (entry){
    			if (entry.name == selText){
    				trainingCluster = entry.id;
    			}
    		});
    	}
    }
    
    var setTrainingCollection = (selText) => {
    	if(collectionList != null){
    		collectionList.forEach (function (entry){
    			if (entry.name == selText){
    				trainingCollection = entry.name;
    			}
    		});
    	}
    }
    
    var setTrainingRanker = (selText) => {
    	if(rankerList != null){
    		rankerList.forEach (function (entry){
    			if (entry.name == selText){
    				trainingRanker = entry.id;
    			}
    		});
    	}
    }
    
    var refreshClusterList = () => {
    	rrRequests.getClusters(function(res){
        	clusterList.length = 0;
        	var clusterButtonNode = document.getElementById("clusterButtonGroup");
        	var clusterMenu = document.getElementById("clusterMenu");
        	while(clusterButtonNode.firstChild){
        		clusterButtonNode.removeChild(clusterButtonNode.firstChild);
        	}
        	if(clusterMenu != null){
        		while(clusterMenu.firstChild){
        			clusterMenu.removeChild(clusterMenu.firstChild);
        		}
        	}
        	
        	res.clusters.forEach(function (entry){
        		clusterList.push(new cluster(entry))
        		clusterButtonNode.appendChild(ButtonFactory("solr-button", entry.cluster_name, function(){
        			clusterStatus(entry.solr_cluster_id);
        		}));
        		
        		clusterButtonNode.appendChild(ButtonFactory("solr-delete-button btn-xs", "X", function(){
        			deleteCluster(entry.solr_cluster_id, entry.cluster_name);
        		}))
        		clusterMenu.appendChild(ListItemFactory(entry.cluster_name));
        	})
        	if(clusterList.length != 0)
        		clusterButtonNode.firstChild.click();
        })
    }
    
    var refreshConfigurationList = () => {
    	rrRequests.getConfigurationList(clusterSelected, function(res){
    		configList.length = 0;
        	var configButtonNode = document.getElementById("configButtonGroup");
        	var configMenu = document.getElementById("configMenu");
        	while(configButtonNode.firstChild){
        		configButtonNode.removeChild(configButtonNode.firstChild);
        	}
        	if(configMenu != null){
        		while(configMenu.firstChild){
        			configMenu.removeChild(configMenu.firstChild);
        		}
        	}
    		res.solr_configs.forEach(function (entry){
    			configList.push(new config(entry));
    			configButtonNode.appendChild(ButtonFactory("solr-button", entry, function(){
    				configStatus(entry, clusterSelected);
    			}))
    			   
    			configButtonNode.appendChild(ButtonFactory("solr-delete-button btn-xs", "X", function(){
        			deleteConfig(clusterSelected, entry);
        		}))
    			
    		})
    	})
    }
    
    var refreshCollectionList = () => {
    	rrRequests.getCollectionList(clusterSelected, function(res){
    		collectionList.length = 0;
        	var collectionButtonNode = document.getElementById("collectionButtonGroup");
        	var collectionMenu = document.getElementById("collectionMenu");
        	while(collectionButtonNode.firstChild){
        		collectionButtonNode.removeChild(collectionButtonNode.firstChild);
        	}
        	if(collectionMenu != null){
        		while(collectionMenu.firstChild){
        			collectionMenu.removeChild(collectionMenu.firstChild);
        		}
        	}
        	
        	if(res.collections != null){
        		res.collections.forEach(function (entry){
        			collectionList.push(new config(entry));
        			collectionButtonNode.appendChild(ButtonFactory("solr-button", entry, function (){
        				collectionStatus(entry);
        			}))
        			collectionButtonNode.appendChild(ButtonFactory("solr-delete-button btn-xs", "X", function(){
        				deleteCollection(clusterSelected, entry);
        			}))
            		collectionMenu.appendChild(ListItemFactory(entry));
        		})
        	}
    	})
    }
    
    var refreshRankerList = () => {
    	rrRequests.getRankerList(function(res){
    		rankerList.length = 0;
        	var rankerButtonNode = document.getElementById("rankerButtonGroup");
        	var collectionMenu = document.getElementById("rankerMenu");
        	while(rankerButtonNode.firstChild){
        		rankerButtonNode.removeChild(rankerButtonNode.firstChild);
        	}
        	
        	if(rankerMenu != null){
        		while(rankerMenu.firstChild){
        			rankerMenu.removeChild(rankerMenu.firstChild);
        		}
        	}
        	
        	if(res.rankers != null){
        		res.rankers.forEach(function (entry){
        			rankerList.push(new ranker(entry));
        			rankerButtonNode.appendChild(ButtonFactory("solr-button", entry.name, function () {
        				rankerStatus(entry.ranker_id);
        			}))
        			rankerButtonNode.appendChild(ButtonFactory("solr-delete-button btn-xs", "X", function(){
        				deleteRanker(entry.ranker_id, entry.name);
        			}))
            		rankerMenu.appendChild(ListItemFactory(entry.name));
        		})
        	}
    	});
    }
    
    var provisionCluster = (name, size) => {
        rrRequests.createClusters(name, size, function(res){
        	refreshClusterList();
        })
    }

    var provisionConfiguration = (name, configFile) => {
    	rrRequests.createConfiguration(clusterSelected, name, configFile, function(res){
    		refreshConfigurationList(clusterSelected);
    	});
    }
    
    var provisionCollection = (collectionName, clusterId, configName) => {
    	rrRequests.createCollection(clusterId, collectionName, configName, function(res){
    		refreshCollectionList(clusterId);
    	});
    }
    
    var provisionRanker = (name, trainingFile) => {
    	rrRequests.createRanker(name, trainingFile, function(res){
    		refreshRankerList();
    	});
    }
    
    var deleteCluster = (id, name) => {
    	if(!dialog.showMessageBox(            {
            type: 'question',
            buttons: ['Delete', 'Cancel'],
            title: 'Confirm',
            message: 'Are you sure you want to delete the cluster: ' + name + '?'
        })){
    		rrRequests.deleteClusters(id, function(res){
    			refreshClusterList();
        	})
    	}
    }
    
    var deleteConfig = (clusterId, configName) => {
    	if(!dialog.showMessageBox(            {
            type: 'question',
            buttons: ['Delete', 'Cancel'],
            title: 'Confirm',
            message: 'Are you sure you want to delete the configuration: ' + configName + '?'
        })){
    		rrRequests.deleteConfig(clusterId, configName, function (res){
    			refreshConfigurationList();
    		})
    	}
    }
    
    var deleteCollection = (clusterId, collectionName) => {
    	if(!dialog.showMessageBox(            {
            type: 'question',
            buttons: ['Delete', 'Cancel'],
            title: 'Confirm',
            message: 'Are you sure you want to delete the collection: ' + collectionName + '?'
        })){
    		rrRequests.deleteCollection(clusterId, collectionName, function (res){
    			refreshCollectionList();
    		})
    	}
    }
    
    var deleteRanker = (rankerId, name) => {
    	if(!dialog.showMessageBox(            {
            type: 'question',
            buttons: ['Delete', 'Cancel'],
            title: 'Confirm',
            message: 'Are you sure you want to delete the ranker: ' + name + '?'
        })){
    		rrRequests.deleteRanker(rankerId, function (res){
    			refreshRankerList();
    		});
    	}
    }
    
    var clusterStatus = (id) => {
    	clusterSelected = id;
    	rrRequests.getClusterStatus(id, function(res){
    		refreshConfigurationList()
    		refreshCollectionList()
    		refreshRankerList()
    		var statusTag = document.getElementById("statusSection");
        	while(statusTag.firstChild){
        		statusTag.removeChild(statusTag.firstChild);
        	}
        	statusTag.appendChild(ParaFactory("Cluster Name: " + res.cluster_name));
        	statusTag.appendChild(ParaFactory("Cluster Size: " + res.cluster_size));
        	statusTag.appendChild(ParaFactory("Cluster id: " + res.solr_cluster_id));
        	statusTag.appendChild(ParaFactory("Cluster Status: " + res.solr_cluster_status));
    	})
    }
    
    var configStatus = (config_name, solr_id) => {
    	configSelected = config_name;
    	var statusTag = document.getElementById("statusSection");
    	while(statusTag.firstChild){
    		statusTag.removeChild(statusTag.firstChild);
    	}
    	statusTag.appendChild(ParaFactory("Cluster Name: " + solr_id));
    	statusTag.appendChild(ParaFactory("Config Name: " + config_name));
    	statusTag.appendChild(ButtonFactory("solr-button", "Download config: "+ config_name, function (){
    		rrRequests.getConfig(config_name, solr_id, function (res){
    	    	statusTag.appendChild(ParaFactory("Downloaded!"));
    		});
    	}));
    }
    
    var indexDocuments = (clusterId, collectionName) => {
		dialog.showOpenDialog(
			function (res) {
				var filesToUpload = res.length;
				dialog.showMessageBox({message:"Files uploading. There will be another popup when finished.", buttons: ["OK"]})
				res.forEach(function(entry){
					console.log(entry);
					rrRequests.indexDocument(clusterId, collectionName, entry, function (res){
						--filesToUpload;
						if(filesToUpload <= 0){
							console.log(res);
							dialog.showMessageBox({message:"Files finished uploading.", buttons: ["OK"]})
						}
					});
				});
		});
    }
    
    var collectionStatus = (id) => {
    	collectionSelected = id;
    	var statusTag = document.getElementById("statusSection");
    	while(statusTag.firstChild){
    		statusTag.removeChild(statusTag.firstChild);
    	}
    	statusTag.appendChild(ParaFactory("Cluster Name: " + clusterSelected));
    	statusTag.appendChild(ParaFactory("Collection Name: " + id));
    	statusTag.appendChild(ButtonFactory("solr-button", "Index Documents", function (){
    		indexDocuments(clusterSelected, id);
    	}));
    	
    }
    
    var rankerStatus = (id) => {
    	rankerSelected = id;
    	rrRequests.getRankerStatus(id, function(res){
    		var statusTag = document.getElementById("statusSection");
        	while(statusTag.firstChild){
        		statusTag.removeChild(statusTag.firstChild);
        	}
        	statusTag.appendChild(ParaFactory("Ranker Name: " + res.name));
        	statusTag.appendChild(ParaFactory("Ranker id: " + res.ranker_id));
        	statusTag.appendChild(ParaFactory("Ranker Status: " + res.status));
        	statusTag.appendChild(ParaFactory("Ranker Status Description: " + res.status_description));
    	});
    }
    
    self.setArgs = (args) => {
      self.args = args
      project.getProjectByID(args.id, (err, proj) => {
        $('#projectName').text(proj.name)
        $('#bluemixID').text(proj.bluemix.uid)
        $('#bluemixEndPoint').text(proj.bluemix.apiEndpoint)
        $('#bluemixOrg').text(proj.org.name)
        $('#bluemixSpace').text(proj.space.name)
        $('#r_rServiceName').text(proj.service.r_r.name)
        $('#r_rServiceKeyName').text(proj.service.r_r.key.name)
        $('#r_rServicePlanName').text(proj.service.r_r.plan.name)
        rrRequests.setUsername(proj.service.r_r.key.username)
        rrRequests.setPassword(proj.service.r_r.key.password)
        refreshClusterList();
      })
    }
    
    self.provisionCluster = () => {
    	if($('#solrClusterName').val() == ""){
    		dialog.showMessageBox({message:"First enter a cluster name", buttons: ["OK"]})
    	} else {
    		provisionCluster($('#solrClusterName').val(), $('#clusterSize').val());
    	}
    }
    
    self.provisionConfiguration = () => {
    	if($('#solrConfigName').val() == ""){
    		dialog.showMessageBox({message:"First enter a configuration name", buttons: ["OK"]})
    	} else {
    		dialog.showOpenDialog({
    			filters: [{ name: 'Configs', extensions: ['zip']}]}, 
    			function (res) {	
    				provisionConfiguration($('#solrConfigName').val(), res[0]);
    		});
    	}
    }
    
    self.provisionCollection = () => {
    	if($('#solrCollectionName').val() == ""){
    		dialog.showMessageBox({message:"First enter a collection name", buttons: ["OK"]})
    	} else if(configSelected == null){
    		dialog.showMessageBox({message:"Click on the desired config then try again.", buttons: ["OK"]})
    	} else {
    		provisionCollection($('#solrCollectionName').val(), clusterSelected, configSelected);
    	}
    }
    
    self.provisionRanker = () => {
    	if($('#solrRankerName').val() == ""){
    		dialog.showMessageBox({message:"First enter a Ranker name", buttons: ["OK"]})
    	} else {
    		dialog.showOpenDialog({
    			filters: [{ name: 'Configs', extensions: ['csv']}]}, 
    			function (res) {	
    	    		provisionRanker($('#solrRankerName').val(), res[0]);
    		});
    	}
    }
    
    self.importCSV = () => {
    	dialog.showOpenDialog({
			filters: [{ name: 'GT CSV', extensions: ['csv']}]}, 
			function (res) {
				fs.readFile(res[0], function(err, data){
					if(err)
						console.log(err)
					else{
						parser.write(data);
						parser.end();
					}
				});
		});
    };
    
    var setSelectionField = (res) => {
    	if(res.response.docs.length > 0){
			var uniqueIDField = document.getElementById("uniqueID");
			var selectionField = document.getElementById("viewingSelection");
			if(selectionField.length == 1){
				for(var entry in res.response.docs[0]){
					var option = document.createElement("option");
					option.value = entry;
					option.innerHTML = entry;
					option.selected = true;
					selectionField.appendChild(option);
					
					var IDoption = document.createElement("option");
					IDoption.value = entry;
					IDoption.innerHTML = entry;
					if(entry == "id" || entry == "uuid" || entry == "_id"){
						IDoption.selected = true;
					}
					uniqueIDField.appendChild(IDoption);
				}
			}
		}
    }
    
    var displayAnswers = () =>{
    	var answersField = document.getElementById("answerField");
		var selectionFieldNodeList = document.getElementById("viewingSelection").childNodes;
    	while(answersField.firstChild){
    		answersField.removeChild(answersField.firstChild);
    	}
    	
    	var sortingStrat = document.getElementById("sortingStrategy");
    	fullAnswer = originalAnswer.slice();
    	if( sortingStrat.value == "Random"){
    		utilities.shuffleArray(fullAnswer);
    	} else if (sortingStrat.value == "Weighted Random"){
    		
    	}
    	
    	for(var index in fullAnswer){
    		var currentAnswer = {};
    		for(var section in fullAnswer[index]){
    			for(var index2 in selectionFieldNodeList){
    				if(selectionFieldNodeList[index2].value == section && selectionFieldNodeList[index2].selected == true)
    					currentAnswer[section] = JSON.stringify(fullAnswer[index][section]);
    			}
    		}
        	var relevanceField = document.createElement('input');
        	relevanceField.type = "number";
        	relevanceField.className = "pull-right relevance";
        	relevanceField.value = 0;
        	answersField.appendChild(relevanceField);
    		answersField.appendChild(document.createElement('pre')).innerHTML = JSON.stringify(currentAnswer, null, 2);
		}
    }
       
    var askQuestion = (cb) => {
    	if(trainingCluster == null || trainingCollection == null){
    		dialog.showMessageBox({message:"First select a cluster and collection.", buttons: ["OK"]})
    	} else {
    		var query = document.getElementById("gtQueryText").innerHTML;
    		currentQuery = query;
    		if(trainingRanker == null){
    			rrRequests.querySolr(trainingCluster, trainingCollection, query, function(res){
    				setSelectionField(res);
    				originalAnswer = res.response.docs;
    				displayAnswers();
    				cb();
    			});
    		} else {
    			rrRequests.queryRanker(trainingCluster, trainingCollection, trainingRanker, query, function(res){
    				setSelectionField(res);
    				originalAnswer = res.response.docs;
    				displayAnswers();
    				cb();
    			});
    		}
    	}
    }
    
    var saveToCSV = () => {
    	var outputRow = [];
    	var uniqueID = document.getElementById("uniqueID").value;
		outputRow.push(document.getElementById("gtQueryText").innerHTML)
    	var answersField = document.getElementById("answerField");
    	var relevance;
    	for(var index = 0; index < answersField.childNodes.length; ++index){
    		if(index%2 == 1) {
    			if(parseInt(relevance) != 0){
    				outputRow.push(fullAnswer[parseInt(index/2)][uniqueID]);
    				outputRow.push(parseInt(relevance));
    			}
    		} else {
    			relevance = answersField.childNodes[index].value;
    		}
    	}
    	var dataString = '';
    	for(var i = 0; i < outputRow.length; ++i){
    		dataString += outputRow[i];
    		if(i != outputRow.length -1)
    			dataString += ', '
    	}
    	
    	if(outputRow.length > 1)
    		fs.appendFileSync("./output.csv", dataString + "\n");
    }
    
	var submitButton = document.getElementById("submitQuestionButton");
	submitButton.addEventListener('click', askQuestion);
	var selectionField = document.getElementById("viewingSelection");
	selectionField.addEventListener('change', displayAnswers);
	var sortingStrat = document.getElementById("sortingStrategy");
	sortingStrat.addEventListener('change', displayAnswers);
	
    $(document).on('click', '.dropdown-menu li', function () {
        var selText = $(this).text();
        $(this).parents('.btn-group').find('.dropdown-toggle').html(selText+' <span class="caret"></span>');
        $('#dLabel').html(selText + '<span class="caret"</span>');
        if($(this).parents('.btn-group').find('.dropdown-toggle')[0].id == "clusterMenuButton") {
      	  setTrainingCluster(selText);
        } else if($(this).parents('.btn-group').find('.dropdown-toggle')[0].id == "collectionMenuButton") {
      	  setTrainingCollection(selText);
        } else if($(this).parents('.btn-group').find('.dropdown-toggle')[0].id == "rankerMenuButton") {
      	  setTrainingRanker(selText);
        }
    });
  }
})()
