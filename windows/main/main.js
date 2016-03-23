/* jshint esnext: true, node: true, asi: true, sub:true */
//const $ = window.$// require('../../js/jquery-2.1.4.min.js')


(function() {
  'use strict'
  const project = require('../../js/project')
  const ipc = require('electron').ipcRenderer

  const listProjects = () => {
    project.getProjects((err,projects)=>{
      if(err) {
        console.log(err)
      } else {
        $('#projectList').empty()
        projects.forEach((proj)=>{
          let li = document.createElement('li');
          let a = document.createElement('a');
          let delButton = document.createElement('button');  
          delButton.className = "btn btn-default";
          delButton.addEventListener('click', function () {project.deleteProject(proj._id, ['data','train','history'])})
          
          a.appendChild(document.createTextNode(proj.name))
          a.href = '#'+proj.config.projectView+"?id="+proj._id
                    
          li.appendChild(a)
          li.appendChild(delButton)
          let span = document.createElement('span')
          span.className = "glyphicon glyphicon-remove"
          span.setAttribute("aria-hidden", "true");
          delButton.appendChild(span)
          
          $('#projectList').append(li)
        })
      }
    })
  }

  document.onreadystatechange = () => {
    if (document.readyState == 'complete') {
      const sauna = require('../../js/sauna')
      let ttool = sauna(document.getElementById('anchor'))

      $('a', 'ul.sidebar-nav').each(function(index) {
        let href = $(this).attr('href')
        $(this).click(function() {
          ttool.n.navigate(href)
        })
      })

      ttool.n.navigate('windows/main/mainView')
    }

    ipc.on('project-update',()=>{
      listProjects()
    })


    listProjects()
  }
})()
