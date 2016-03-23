/*
The MIT License (MIT)

Copyright (c) 2015 srakowski

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/* Change log:
 *
 * General changes - cmm 01/06/2016
 *   + added license to sauna.js obtained from: https://github.com/srakowski/sauna
 *   + added ko variable
 *   + modified rootDir
 *
 * General changes to support passing arguments - cmm 01/13/2016
 */

(function () {

	var fs = require('fs');
	var path = require('path');
	var ko = require("./knockout-3.4.0");

	//var rootDir = path.dirname(require.main.filename) + "\\";
  var rootDir = path.resolve(".")+path.sep;

	var Navigator = function (element) {
		var self = this;
		var _element = element;
		var _v = null;
		var _cb = null;

		self.navigate = function (view, callback) {
			_cb = callback;
			location.hash = "#" + view;
		};

		window.addEventListener("hashchange", function () {
			var hash = location.hash;
			var viewName = hash.slice(1, hash.length);
			_navigate(viewName);
		}, false);

		var _navigate = function (viewURL) {

			var view = viewURL.split('?')[0]
			var args = null

			if(viewURL.indexOf('?') > -1) {
				var temp = viewURL.split('?')[1]
				args = JSON.parse('{\"'+temp.replace(/&/g,'\",\"').replace(/=/g,'\":\"')+'\"}')
			}

			fs.readFile(rootDir + view + ".html", "utf-8", function (err, data) {
				if (_v != null) {
					ko.removeNode(_v);
					_v = null;
				}
				_element.innerHTML = data;
				_v = document.getElementById(view)
				var vmModule = _v.getAttribute("data-vm");
				VM = require(rootDir + vmModule);
				VM = new VM();
				ko.applyBindings(VM, _v);

				if(args && typeof VM.setArgs === 'function') {
					VM.setArgs(args)
				}

				if (typeof _cb == 'function') {
					_cb(VM);
					_cb = null;
				}
			});
		}
	};

	module.exports = function (element) {
		var navigator = new Navigator(element);
		return {
			n: navigator
		};
	};

})();
