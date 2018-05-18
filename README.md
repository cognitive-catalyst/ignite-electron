# ignite-electron
This is an electron based platform which provides a framework for plugins to interact with the Watson services.

# Installation
Prerequisites:
Node.JS

To install the framework:
1. Navigate to the `ignite-electron-master` folder
2. `npm install`

# Installing Plugins
In a future release, it will be possible to install plugins directly from the framework. For now, they must be installed outside of the application.

1. Copy the framework to ignite-electron-master/plugins. The plugin for Retrieve and Rank should already be included.
2. Navigate to `ignite-electron-master/plugins/pluginName` (ex. `ignite-electron-master/plugins/r_r`)
3. npm install
4. Check for an entry for the plugin in the file `ignite-electron-master/data/db/.ignitedb`. Add one if necessary. An example is:
{"type":"plugin","shortName":"r_rtool","name":"Retrieve and Rank Tool","description":"Create a new project for R&R", "icon":"https://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/images/service-icons/RetrieveandRank.svg", "projectView":"plugins/r_r/r_rProjectView","config":"plugins/r_r/r_rConfigView","_id":"2Q2fiwqheoN02t9K"}

# Using the application

Run the application with the command:
1. `npm start`

The initial screen will contain a list of projects on the left and a grid of plugins on the right. The first thing to do is to create a new project.

## Creating a new project

To create a new project, click the `create` button on the desired project. This should launch the plugin's project creation process. This process should be straight forward but the plugin's `readme.md` should contain plugin specific instructions.

## Deleting an existing Project

To delete an existing project, highlight the project in the project list and click the `X`. This will remove the project from the framework but does not delete associated the data folder (`ignite-electron-master/data/projects/projectName`). To fully remove the project you must also delete this data folder. Failure to do so could potentially cause naming conflicts in the future. 
