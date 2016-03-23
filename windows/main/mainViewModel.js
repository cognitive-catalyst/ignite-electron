/* jshint esnext: true, node: true, asi: true, sub:true */
const $ = require('../../js/jquery-2.1.4.min.js')
const path = require('path')
const Datastore = require('nedb')
const db = new Datastore({
  filename: path.join(path.resolve(".") , 'data', 'db','.ignitedb'),
  autoload: true
})

module.exports = function() {
  'use strict'
  let anchor = document.getElementById('plugin-anchor')
  db.find({
      'type': 'plugin'
    })
    .sort({
      'name': 1
    })
    .exec(function(err, docs) {
      docs.forEach(function(doc) {
        let pluginCard = document.createElement("div")
        pluginCard.className = 'plugin-card'

        let pluginCardImage = document.createElement('div')
        pluginCardImage.className = 'plugin-card-image'
        let img = document.createElement('img')
        img.src = doc.icon
        pluginCardImage.appendChild(img)
        pluginCard.appendChild(pluginCardImage)

        let pluginCardContent = document.createElement('div')
        pluginCardContent.className = "plugin-card-content"

        let heading = document.createElement('h3')
        let hText = document.createTextNode(doc.name)
        heading.appendChild(hText);

        let content = document.createElement('p')
        let cText = document.createTextNode(doc.description)
        content.appendChild(cText)

        pluginCardContent.appendChild(heading)
        pluginCardContent.appendChild(content)
        pluginCard.appendChild(pluginCardContent)

        let pluginCardBottom = document.createElement('div')
        pluginCardBottom.className = 'plugin-card-bottom'

        let button = document.createElement('a')
        button.setAttribute('role', 'button')
        button.className = 'btn btn-primary btn-sm pull-right'
        button.href='#'+doc.config
        button.appendChild(document.createTextNode('Create'))
        pluginCardBottom.appendChild(button)
        pluginCard.appendChild(pluginCardBottom)

        anchor.appendChild(pluginCard)
      })
    })
}
