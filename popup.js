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

	let dateObj = new Date();
	let snapshotsDiv = document.getElementById("snapshots");
	saveSnap(dateObj);
	appendTabSnapList(snapshotsDiv, dateObj.getTime());
};

/*
let printBtn = document.getElementById('printBtn');
printBtn.onclick = function() {
		printChromeStore();
}
*/

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
		snapshotsDiv.innerHTML = "";
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

				let timeVal = key.substr(key.indexOf('_')+1);
				console.log("Time is " + timeVal);
				//let timestamp = new Date(new Number(time));
				appendTabSnapList(snapshotsDiv, timeVal);
			} else {
				console.log(me + "Found something I was not expecting.");
			}
		});
	});
}

function appendTabSnapList(snapshotsDiv, timeVal) {
	let me = "appendTabSnapList: " + timeVal;
	console.log(me);
	let snapPara = document.createElement("p");
	addLoadOption(snapPara, timeVal);
	addDeleteOption(snapPara, timeVal);
	//addArchiveOption(snapPara, timeVal);
	//addDownloadOption(snapPara, timeVal);
	snapshotsDiv.appendChild(snapPara);
}

function refreshTabSnapList() {
	let me = "refreshTabSnapList: ";
	console.log(me);
	init();
}

/**
	* @desc adds a delete option to the snap
	* @param parentElement $parentElement - parent element to append this to
	* @param number $timeValVal - milliseconds based on the Date.getTime() function
	* @return
	*/
function addDeleteOption(parentElement, timeVal) {
	// <span id="time" onclick="deleteSnap(time)"> <b>X</b> </span>
	let snapSpan = document.createElement("span");
	snapSpan.id = timeVal;
	let snapBold = document.createElement("b");
	let snapSpanInner = document.createTextNode(" X ");
	snapBold.appendChild(snapSpanInner);
	snapSpan.appendChild(snapBold);
	snapSpan.addEventListener('click', function() {
		deleteSnap(timeVal);
	});
	parentElement.appendChild(snapSpan);
}

/**
	* @desc adds an archive option to the snap
	* @param parentElement $parentElement - parent element to append this to
	* @param number $timeValVal - milliseconds based on the Date.getTime() function
	* @return
	*/
function addArchiveOption(parentElement, timeVal) {
	// <span id="time" onclick="archiveSnap(time)"> <b>A</b> </span>
	let snapSpan = document.createElement("span");
	snapSpan.id = timeVal;
	let snapBold = document.createElement("b");
	let snapSpanInner = document.createTextNode(" A ");
	snapBold.appendChild(snapSpanInner);
	snapSpan.appendChild(snapBold);
	snapSpan.addEventListener('click', function() {
		archiveSnap(timeVal);
	});
	parentElement.appendChild(snapSpan);
}

/**
	* @desc adds a load option to the snap
	* @param parentElement $parentElement - parent element to append this to
	* @param number $timeValVal - milliseconds based on the Date.getTime() function
	* @return
	*/
function addLoadOption(parentElement, timeVal) {
	let dateVal = new Date(new Number(timeVal));
	let snapSpan = document.createElement("span");
	snapSpan.id = timeVal;
	let snapSpanInner = document.createTextNode(dateVal.toLocaleString());
	snapSpan.appendChild(snapSpanInner);
	snapSpan.addEventListener('click', function() {
		loadSnap(timeVal);
	});
	parentElement.appendChild(snapSpan);
}

/**
	* @desc adds a download option to the snap
	* @param parentElement $parentElement - parent element to append this to
	* @param number $timeValVal - milliseconds based on the Date.getTime() function
	* @return
	*/
function addDownloadOption(parentElement, timeVal) {
	let snapSpan = document.createElement("span");
	snapSpan.id = timeVal;
	let snapBold = document.createElement("b");
	let snapSpanInner = document.createTextNode(" D ");
	snapBold.appendChild(snapSpanInner);
	snapSpan.appendChild(snapBold);
	snapSpan.addEventListener('click', function() {
		downloadSnap(timeVal);
	});
	parentElement.appendChild(snapSpan);
}

/**
	* @desc saves the a snapshot of all the windows and tabs
	* @param Date $dateVal - a date object that represents the timestamp
	* @return nothing
	*/
function saveSnap(dateVal) {
	let me = "saveSnap: ";
	console.log(me + "Snap date is " + dateVal.toLocaleString());

	getOpenWindows(function(windows) {
		let snapKey = "TabSnapWindow_" + dateVal.getTime().toString();
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
		let snapKey = "TabSnapTabCollection_" + dateVal.getTime().toString();
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
	* @desc deletes a snapshot of all the windows and tabs
	* @param number $timeVal - milliseconds based on the Date.getTime() function
	* @return nothing
	*/
function deleteSnap(timeVal) {
	let me = "deleteSnap: ";
	console.log(me + "User clicked " + timeVal);

	//This block of code is written in nested, serial fashion to circumvent the
	//asymetrical functional calls to the chrome API. We first get all the tabs,
	//then we get all the windows, then we create each window and its associated
	//tabs.

	let key = "TabSnapTabCollection_" + timeVal.toString();
	console.log(me + "Attempting to remove " + key);
	chrome.storage.local.remove([key],
		function(result) {
			console.log(me + "Deleted " + key + " : Result = " + result);
		}
	);

	key = "TabSnapWindow_" + timeVal.toString();
	console.log(me + "Attempting to remove " + key);
	chrome.storage.local.remove([key],
		function(result) {
			console.log(me + "Deleted " + key + " : Result = " + result);
		}
	);

	refreshTabSnapList()
}

/**
	* @desc downloads a snapshot of all the windows and tabs
	* @param number $timeVal - milliseconds based on the Date.getTime() function
	* @return nothing
	*/
function downloadSnap(timeVal) {
	let me = "downloadSnap: ";
	console.log(me + "User clicked " + timeVal);

	//This block of code is written in nested, serial fashion to circumvent the
	//asymetrical functional calls to the chrome API. We first get all the tabs,
	//then we get all the windows, then we create each window and its associated
	//tabs.

	// Download snaps here

}

/**
	* @desc loads a snapshot of all the windows and tabs
	* @param number $timeVal - milliseconds based on the Date.getTime() function
	* @return nothing
	*/
function loadSnap(timeVal) {
	let me = "loadSnap: ";
	console.log(me + "User clicked " + timeVal);

	//This block of code is written in nested, serial fashion to circumvent the
	//asymetrical functional calls to the chrome API. We first get all the tabs,
	//then we get all the windows, then we create each window and its associated
	//tabs.

	let tabKey = "TabSnapTabCollection_" + timeVal.toString();
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

function printChromeStore() {
	chrome.storage.local.get(null, function(result) {
	    console.log(result);
	});
}
