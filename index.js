/* jshint esnext: true, node: true, asi: true */
'use strict'
const electron = require('electron')
const BrowserWindow = electron.BrowserWindow
const app = electron.app
const ipc = electron.ipcMain
const path = require('path')
const mkdirp = require('mkdirp')

const APPLICATION = 'ignite'
const MAIN_URL = 'file://' + path.join(__dirname, 'windows', 'main','main.html')

let mainWindow = null

//ensure our data directory is created
mkdirp(path.join(__dirname, 'data', 'db'),function(err) {
  if(err) {
  console.error('failed to create ./data/db directory')
  }
})

app.on('ready', function() {
  mainWindow = new BrowserWindow({
    'min-width':1024,
    'min-height':768,
    width:1024,
    height:768,
    title: APPLICATION
  })
  mainWindow.loadURL(MAIN_URL)

  mainWindow.on('closed',function(){
    mainWindow=null
  })
})
