/**
MIT License

Copyright (c) 2019 James Wilmoth

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


//Call init each time we load the popup menu
init();

let snapBtn = document.getElementById('snapBtn');
snapBtn.onclick = function() {
	let me = "snapBtn.onclick: "

	//This code block saves the current snap and then adds the timestamp to the
	//popup menu.

	let dateNow = new Date();
	saveSnap(dateNow);
	let snapshots = document.getElementById("snapshots").innerHTML;
	snapshots += "<p>" + dateNow.toLocaleString() + "<b>    X</b></p>";
	document.getElementById("snapshots").innerHTML = snapshots;
};

//var windowMap = new Map;
//var tabCollections = new Array;

/**
	* @desc initializes the popup menu html with saved snapshot timestamps
	* @param nothing
	* @return nothing
	*/
function init() {
	let me = "init: ";
	console.log(me);

	//Get everything from the local storage
	chrome.storage.local.get(null, function(possibilities) {
		console.log(me + "examining possibilities");

		let snapshotsDiv = document.getElementById("snapshots");
		//Iterate through each possible pair from the local storage
		let load = Object.entries(possibilities);
		load.forEach(pair => {
			let key = pair[0];
			let val = pair[1];
			if(key.search("TabSnapWindow")) {

				//// TODO: We don't do anything with the window on the popup menu at
				//this time; maybe we can do something useful with it later? For now,
				//just log.

				console.log(me + "Found a window!");
			} else if(key.search("TabSnapTabCollection")) {
				console.log(me + "Found a tab collection!");

				//This block of code handles parsing the timestamp and adding it to
				//the html popup menu.

				let time = key.substr(key.indexOf('_')+1);
				let timestamp = new Date(new Number(time));
				let snapPara = document.createElement("p");
				snapPara.id = time;
				let snapVal = document.createTextNode(timestamp.toLocaleString());
				snapPara.appendChild(snapVal);
				snapPara.addEventListener('click', function() {
					loadSnap(time);
				});
				snapshotsDiv.appendChild(snapPara);

			} else {
				console.log(me + "Found something I was not expecting.");
			}
		});
	});
}

/**
	* @desc saves the a snapshot of all the windows and tabs
	* @param Date $dateNow - a date object that represents the timestamp
	* @return nothing
	*/
function saveSnap(dateNow) {
	let me = "saveSnap: ";
	console.log(me + "Snap date is " + dateNow.toLocaleString());

	getOpenWindows(function(windows) {
		let snapKey = "TabSnapWindow_" + dateNow.getTime().toString();
		let snapVal = JSON.stringify(windows);
		let snapMap = {};
		snapMap[snapKey] = snapVal;
		chrome.storage.local.set(snapMap, function() {
			if(chrome.runtime.lastError !== null && typeof chrome.runtime.lastError === "object") {
				//// TODO: Display a warning to the user
				console.log(me + chrome.runtime.lastError.message);
			} else {
				console.log(me + 'Saved snap windows as ' + snapKey);
			}
		});
	});

	getOpenTabs(function(tabs) {
		let snapKey = "TabSnapTabCollection_" + dateNow.getTime().toString();
		let snapVal = JSON.stringify(tabs);
		let snapMap = {};
		snapMap[snapKey] = snapVal;
		chrome.storage.local.set(snapMap, function() {
			if(chrome.runtime.lastError !== null && typeof chrome.runtime.lastError === "object") {
				//// TODO: Display a warning to the user
				console.log(me + chrome.runtime.lastError.message);
			} else {
				console.log(me + 'Saved snap tabs as ' + snapKey);
			}
		});
	});
}

/**
	* @desc gets all the open windows
	* @param function $callback - a function to call with results
	* @return nothing
	*/
function getOpenWindows(callback) {
	let me = "getOpenWindows: ";
	console.log(me);

	chrome.windows.getAll({},
		function(windows) {
			var windowResults = {};
			windows.forEach(window => {
				windowResults[window.id] = JSON.stringify(window);
			});
			if(callback) {
				callback(windowResults);
			}
		}
	);
}

/**
	* @desc gets all the open tabs
	* @param function $callback - a function to call with results
	* @return nothing
	*/
function getOpenTabs(callback) {
	let me = "getOpenTabs: ";
	console.log(me);

	chrome.tabs.query({}, function(tabs) {
		var tabResults = new Array();
		for(i=0; i<tabs.length; i++) {
			tabResults.push(JSON.stringify(tabs[i]));
		}
		if(callback) {
			callback(tabResults);
		}
	});
}

/**
	* @desc loads a snapshot of all the windows and tabs
	* @param number $time - milliseconds based on the Date.getTime() function
	* @return nothing
	*/
function loadSnap(time) {
	let me = "loadSnap: ";
	console.log(me + "User clicked " + time);

	//This block of code is written in nested, serial fashion to circumvent the
	//asymetrical functional calls to the chrome API. We first get all the tabs,
	//then we get all the windows, then we create each window and its associated
	//tabs.

	let tabKey = "TabSnapTabCollection_" + time.toString();
	getSavedTabs(tabKey,
		function(tabs) {

			//This block of code creates a map of to tabs' ex-windows' ids. We will
			//use this to make sure we create the tabs in the right windows since
			//the new windows will have new ids.

			let tabMap = new Map();
			tabs.forEach(tab => {
				if(!tabMap.has(tab.windowId)) {
					tabMap.set(tab.windowId, new Array());
				}
				tabMap.get(tab.windowId).push(tab);
			});
			console.log(me + "tabMap:");
			console.log(tabMap);

			let windowKey = "TabSnapWindow_" + time.toString();
			getSavedWindows(windowKey,
				function(windows) {
					console.log(me + "Tabs:");
					console.log(tabs);
					console.log(me + "Windows:");
					console.log(windows);

					for(const [key, value] of windows.entries()) {
						chrome.windows.create(value, function(window) {
							tabMap.get(key).forEach(tab => {
								tab.windowId = window.id;
						  	chrome.tabs.create(tab);
							});
						});
					}
				}
			);
		}
	);
}

/**
	* @desc uses a key to locate windows from the local storage
	* @param string $key - a string of the format "TabsnapWindow_" +
	*   Date.getTime().toString()
	* @param function $callback - a function to call with the result
	* @return nothing
	*/

function getSavedWindows(key, callback) {
	let me = "getSavedWindows: ";
	console.log(me);

	chrome.storage.local.get([key],
		function(result) {
			var windowResults = new Map();
			//Parse the JSON string into an object map
			let windowVal = JSON.parse(Object.values(result)[0]);
			//Iterate through the object map
			for (let [key, value] of Object.entries(windowVal)) {
				let window = JSON.parse(value);
				let windowId = window.id;

				//This block of code handles properties that we saved but that cannot be
				//used for creating a new window. While this code works now, it
				//unfortunately will have to evolve over time with the Chrome API.

				delete window['alwaysOnTop'];
				delete window['id'];
				switch(window['state']) {
				  case 'maximized':
				  case 'fullscreen':
				    if(window['focused'] === false) {
				      delete window['focused'];
				    }
				  case 'minimized':
				    if(window['state'] === 'minimized' && window['focused'] === true) {
				      delete window['focused'];
				    }
				    //Delete all of these if maximized, fullscreen, or minimized
				    delete window['left'];
				    delete window['top'];
				    delete window['width'];
				    delete window['height'];
				}

				console.log(me + "Window:");
				console.log(window);

				windowResults.set(windowId,window);
			}
			if(callback) {
				callback(windowResults);
			}
		}
	);
}

////////////////////////////////////////////////////////////////////////////////
function getSavedTabs(key, callback) {
	let me = "getSavedTabs: ";
	console.log(me);

	chrome.storage.local.get([key],
		function(result) {
			var tabResults = new Array();
			//Parse the JSON string into an object map
			let tabCollectionVal = JSON.parse(Object.values(result)[0]);
			//Iterate through the object map
			for (let [key, value] of Object.entries(tabCollectionVal)) {
				let tab = JSON.parse(value);
				let windowId = tab.windowId;
				for(let [key, value] of Object.entries(tab)) {

					//This block of code handles properties that we saved but that cannot
					//be used for creating a new tab. While this code works now, it
					//unfortunately will have to evolve over time with the Chrome API.

					switch(key) {
						case 'windowId':
						case 'index':
						case 'url':
						case 'active':
						case 'selected':
						case 'pinned':
						case 'openerTabId': break;
						default: delete tab[key];
					}
				}

				console.log(me + "Tab:");
				console.log(tab);

				tabResults.push(tab);
			}
			if(callback) {
				callback(tabResults);
			}
		}
	);
}
