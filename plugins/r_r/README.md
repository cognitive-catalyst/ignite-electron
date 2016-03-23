# Project Creation
Creating a new project for the R&R plugin consists of following a few simple steps.

## Bluemix Configuration
This page is where you log into Bluemix. Select your bluemix region from the dropdown menu and enter your credentials.

## Bluemix Target Configuration
After successfully loggin into Bluemix, the page will advance to Bluemix Target Configuration. First select the Bluemix organization. After selecting the org, the dropdown for the Bluemix spaces will be populated. Select the desired space.

## Configuration Page
After selecting your Bluemix Space, the page will advance to the R&R Instance Configuration. The plugin allows for the use of an existing R&R service or the creation of a new R&R service.

### Existing service
The dropdown menu will be populated with a list of services available in the space that was selected in the previous step. To use an existing service, select it from the list and click the "Use Existing" button. Be sure that the service selected is an R&R service. There is no validity check. This will pull the required credentials from bluemix to use service that has been previously set up. This does not alter any existing clusters, collections, or rankers that already exist.

### New service
If you do not have an existing service that you wish to use, a new R&R service can be created. Simply enter in the desired service name, select a plan from the drop down menu, and click the "Create" Button.

## Project Configuration
After either creating a new service or selecting an existing one, the page will advance to the Project Configuration. This page is where the creation of a project is finalized. Enter in a unique name into the text field and click on "Create Project". The new project should appear in the project list to the left. Click on the project to open it.

It is highly recommended that project names are unique. Project data is currently stored in a filesystem architecture which is dependent on the project name. Any duplicate names may cause conflicts.

# Project View
To begin viewing a project, click on the project name on the left side of the screen. This should launch the project overview.

## Configuration Page
The initial page provides an overview of the project. This includes the Bluemix region, org, and space, as well as the service name.

## Solr Architecture Page
The purpose of this page is to simplify the management of a R&R service. The contents of this page are populated by calling the REST APIs detailed on the [R&R API Reference documentation](https://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/retrieve-and-rank/api/v1/).

### Solr Clusters
This portion of the page shows the existing clusters for the service being used by the project. New clusters can be created by selecting a size from the dropdown menu, providing a cluster name, and clicking the "+" button. A cluster can be deleted by clicking on the "X" to the right of the cluster name.

Selecting a cluster by clicking on the button with the cluster name will populate the configurations and collections available for that cluster. Additionally, details of the cluster are available at the bottom of the screen.

### Configurations for Cluster
The existing configurations for the selected cluster will appear in this panel. New configurations can be created by providing the configuration name, clicking the "+" button, and selecting the desired .zip file in the file system window that pops up. A configuration can be deleted by pressing the "X" next to the configuration name. Deletion will fail if there are any collections using the configuration.

Selecting a configuration by clicking on the corresponding button will display information about the configuration at the bottom of the window. In addition, a button will also appear where the configuration zip can be downloaded.

### Collections for Cluster
The existing collections for the selected cluster will appear in this panel. To create a new collection, an existing configuration must first be selected. After clicking on the desired configuration, provide a collection name and press the "+" button. A collection can be deleted by pressing the "X" next to the collection name.

Selecting a collection by clicking on the corresponding button will display information about the collection at the bottom of the window. In addition, a button will also appear that allows new documents to be indexed into the collection. Clicking the button will open up a file system browser window and allow for the selection of a document. Currently, only JSON documents are supported. To index another type of document, please refer to the [Index documents](https://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/retrieve-and-rank/api/v1/#index_doc) section of the official documentation.

###Rankers for Service
All rankers the service are displayed in this panel. New rankers can be created by providing a ranker name, clicking the "+" button, and selecting a ground truth csv file. A ranker can be deleted by pressing the "X" next to the ranker name.

Selecting a ranker by clicking on the corresponding button will display information about the collection at the bottom of the window. The Ranker status and description are available here.

## Training Page
The intent of this page is to provide a simple interface for creating the ground truth to train a ranker. 

The Solr Cluster/Collections/Rankers dropdown menus are used to determine how the queries are routed. The rankers dropdown is optional. If no ranker is selected, the queries will be routed directly against the selected collection.

The Unique Identifier dropdown is used to select the unique field being returned by the queries. This is usually named some variation of ID. The dropdown will be populated after the first query.

The sorting strategy dropdown is used to determine the ordering of the documents which get returned. A random ordering has been preselected.

The Fields to View selection menu will alter whether or not a field is displayed in the query response. The intent is to simply the response output and make ground truth creation easier.

The Import CSV for GT button will allow you to select a single column csv of queries. This allows you to automatically step through a set of predetermined queries and ranking the results. This approach is highly recommended but the Query Text field is also editable for entering questions "on the fly".

The Submit/Start/Next button will ask the next question to the collection/ranker. When pressed, the current rankings will be appended to output.csv in the ignite-electron-master folder. The ability to choose an output file will be added in a future release.

### Basic instructions
1. Select a Cluster and collection (optionally, select a ranker)
2. Choose a CSV to import
3. Click Start
4. Select the Unique Identifier from the corresponding dropdown. It may have been preselected for you.
5. Make the responses easier to read by deselecting a few fields in "Fields to view"
6. Rank some of the results
7. Click Next
8. Repeat from step 6 until finished.

The results are recorded in output.csv in the ignite-electron-master folder. It is recommended that you rename/move the file after each session.

## Testing Page
Not yet implemented.

#Troubleshooting
Problem: I've created a project but when I click the project overview page nothing shows up.
Solution: The problem is probably due to not correctly installing the plugin. You are likely lacking some node modules. Navigate to ignite-electron-master/plugings/r_r and run the command npm install.

For other issues the developer console can be a valuable tool. Under View->Toggle Developer Tools. This should open the developer tools on the side of the window. In the tab at the top of this pane, choose console. There will usually be an output here if an error has occurred.

