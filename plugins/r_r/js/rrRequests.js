var https = require('https');
var fs = require('fs');
var qs = require('querystring');
var FormData = require('form-data');
var request = require('request');

var responseHandler = (callback) => {
	return function(response){
		var body = '';
		response.on('data', function(d){
			body +=d;
		});

		response.on('end', function (){
			var parsed = JSON.parse(body);
			callback(parsed);
		});
	}
}

var responseHandlerFile = (name, callback) => {
	return function(response){
		var file = fs.createWriteStream(name+'.zip');
		
		response.on('data', function(d){
			file.write(d);
		});

		response.on('end', function(){
			file.end();
			callback();
		})
	}
}

module.exports.rrRequests = function (){
	
	this.rrHost = "gateway.watsonplatform.net";
	this.rrPath = "/retrieve-and-rank/api/v1";
	var username;
	var password;
	
	this.setUsername = function(uname){
		this.username = uname;
	}
	
	this.setPassword = function(pw){
		this.password = pw;
	}
	
	this.getClusters = function(callback){
		return https.get({
			host: this.rrHost,
			path: this.rrPath+'/solr_clusters',
			headers: {
				'Authorization':'Basic ' + new Buffer(this.username + ':' + this.password).toString('base64')
			}
		}, responseHandler(callback));
	}
	
	this.getClusterStatus = function(clusterId, callback){
		return https.get({
			host: this.rrHost,
			path: this.rrPath+'/solr_clusters/'+clusterId,
			headers: {
				'Authorization':'Basic ' + new Buffer(this.username + ':' + this.password).toString('base64')
			}
		}, responseHandler(callback));
	}
	
	this.getRankerStatus = function(rankerId, callback){
		console.log(rankerId);
		return https.get({
			host: this.rrHost,
			path: this.rrPath+'/rankers/'+rankerId,
			headers: {
				'Authorization':'Basic ' + new Buffer(this.username + ':' + this.password).toString('base64')
			}
		}, responseHandler(callback));
	}
	
	this.createClusters = function(name, size, callback){
		var post_data = JSON.stringify({
			'cluster_size': size,
			'cluster_name': name
		})
		var req = https.request({
			host: this.rrHost,
			path: this.rrPath+'/solr_clusters',
			method: 'POST',
			headers: {
				'Authorization':'Basic ' + new Buffer(this.username + ':' + this.password).toString('base64'),
				'Content-Type':'application/json'
			}
		}, responseHandler(callback));
		req.write(post_data);
		return req.end();	
	}
	
	this.createConfiguration = function(id, name, configFile, callback){
		var req = https.request({
			host: this.rrHost,
			path: this.rrPath+'/solr_clusters/'+id+'/config/'+name,
			method: 'POST',
			headers: {
				'Authorization':'Basic ' + new Buffer(this.username + ':' + this.password).toString('base64'),
				'Content-Type':'application/zip',
			}
		}, responseHandler(callback));
		fs.readFile(configFile, function(err, data){
			if(err)
				console.log(err)
			else{
				req.write(data);
				req.end();
			}
		});
	}
	
	this.indexDocument = function(id, name, document, callback){
		var req = https.request({
			host: this.rrHost,
			path: this.rrPath+'/solr_clusters/'+id+'/solr/'+name+'/update',
			method: 'POST',
			headers: {
				'Authorization':'Basic ' + new Buffer(this.username + ':' + this.password).toString('base64'),
				'Content-Type': 'application/json'
			}
		}, responseHandler(callback));
		fs.readFile(document, function(err, data){
			if(err)
				console.log(err)
			else{
				req.write(data);
				req.end();
			}
		});
	}

	this.createCollection = function(id, name, configFile, callback){
		var createPath = "?action=CREATE&name="+name+"&collection.configName="+configFile+"&wt=json";
		var req = https.get({
			host: this.rrHost,
			path: this.rrPath+'/solr_clusters/'+id+'/solr/admin/collections/'+createPath,
			headers: {
				'Authorization':'Basic ' + new Buffer(this.username + ':' + this.password).toString('base64'),
			}
		}, responseHandler(callback));
	}
	
	this.createRanker = function(name, trainingFile, callback){
		var formData = {
			training_data: fs.createReadStream(trainingFile),
			training_metadata: "{\"name\":\""+name+"\"}"
		}
		
		request.post({
			url: "https://"+this.rrHost+this.rrPath+'/rankers',
			formData: formData,
			'auth' : {
				'user': this.username,
				'pass': this.password
			}
		}, function optionalCallback(err, httpResponse, body) {
		  if (err) {
		    return console.error('upload failed:', err);
		  }
		  callback(JSON.parse(body));
		});	
	}
	
	this.getConfigurationList = function(id, callback){
		return https.get({
			host: this.rrHost,
			path: this.rrPath+'/solr_clusters/'+id+'/config',
			headers: {
				'Authorization':'Basic ' + new Buffer(this.username + ':' + this.password).toString('base64')
			}
		}, responseHandler(callback));
	}
	
	this.getConfig = function(name, id, callback){
		return https.get({
			host: this.rrHost,
			path: this.rrPath+'/solr_clusters/'+id+'/config/'+name,
			encoding: null,
			headers: {
				'Authorization':'Basic ' + new Buffer(this.username + ':' + this.password).toString('base64')
			}
		}, responseHandlerFile(name, callback));
	}	
	
	this.getCollectionList = function(id, callback){
		return https.get({
			host: this.rrHost,
			path: this.rrPath+'/solr_clusters/'+id+'/solr/admin/collections?action=LIST&wt=json',
			headers: {
				'Authorization':'Basic ' + new Buffer(this.username + ':' + this.password).toString('base64')
			}
		}, responseHandler(callback));
	}
	
	this.getRankerList = function(callback){
		return https.get({
			host: this.rrHost,
			path: this.rrPath+'/rankers',
			headers: {
				'Authorization':'Basic ' + new Buffer(this.username + ':' + this.password).toString('base64')
			}
		}, responseHandler(callback));
	}
	
	this.deleteClusters = function(id, callback){
		var req = https.request({
			host: this.rrHost,
			path: this.rrPath+'/solr_clusters/'+id,
			method: 'DELETE',
			headers: {
				'Authorization':'Basic ' + new Buffer(this.username + ':' + this.password).toString('base64'),
				'Content-Type':'application/zip',
			}
		}, responseHandler(callback));
		req.end();
	}
	
	this.deleteConfig = function(id, config, callback){
		var req = https.request({
			host: this.rrHost,
			path: this.rrPath+'/solr_clusters/'+id+'/config/'+config,
			method: 'DELETE',
			headers: {
				'Authorization':'Basic ' + new Buffer(this.username + ':' + this.password).toString('base64'),
			}
		}, responseHandler(callback));
		req.end();
	}
	
	this.deleteCollection = function(id, name, callback){
		var createPath = "?action=DELETE&name="+name+"&wt=json";
		var req = https.get({
			host: this.rrHost,
			path: this.rrPath+'/solr_clusters/'+id+'/solr/admin/collections/'+createPath,
			headers: {
				'Authorization':'Basic ' + new Buffer(this.username + ':' + this.password).toString('base64'),
			}
		}, responseHandler(callback));
	};
	
	this.deleteRanker = function(rankerId, callback){
		var req = https.request({
			host: this.rrHost,
			path: this.rrPath+'/rankers/'+rankerId,
			method: 'DELETE',
			headers: {
				'Authorization':'Basic ' + new Buffer(this.username + ':' + this.password).toString('base64'),
			}
		}, responseHandler(callback));
		req.end();
	}
	
	this.querySolr = function (clusterId, collection, query, callback){
		return https.get({
			host: this.rrHost,
			path: this.rrPath+'/solr_clusters/'+clusterId+'/solr/'+collection+'/select?q='+encodeURIComponent(query)+'&wt=json&rows=50',
			headers: {
				'Authorization':'Basic ' + new Buffer(this.username + ':' + this.password).toString('base64')
			}
		}, responseHandler(callback));
	}
	
	this.queryRanker = function(clusterId, collection, ranker, query, callback){
		return https.get({
			host: this.rrHost,
			path: this.rrPath+'/solr_clusters/'+clusterId+'/solr/'+collection+'/fcselect?ranker_id='+ranker+'&q='+encodeURIComponent(query)+'&wt=json&rows=50',
			headers: {
				'Authorization':'Basic ' + new Buffer(this.username + ':' + this.password).toString('base64')
			}
		}, responseHandler(callback));
	}
}