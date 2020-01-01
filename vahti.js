// ==UserScript==
// @name Travian Vahti
// @namespace promisevahti
// @author Aleksi
// @license GNUv3
// @description WIP
// @include *://*.travian.*
// @include *://*/*.travian.*
// @include *://*.*.travian.*
// @exclude *://*.travian*.*/hilfe.php*
// @exclude *://*.travian*.*/index.php*
// @exclude *://*.travian*.*/anleitung.php*
// @exclude *://*.travian*.*/impressum.php*
// @exclude *://*.travian*.*/anmelden.php*
// @exclude *://*.travian*.*/gutscheine.php*
// @exclude *://*.travian*.*/spielregeln.php*
// @exclude *://*.travian*.*/links.php*
// @exclude *://*.travian*.*/geschichte.php*
// @exclude *://*.travian*.*/tutorial.php*
// @exclude *://*.travian*.*/manual.php*
// @exclude *://*.travian*.*/ajax.php*
// @exclude *://*.travian*.*/ad/*
// @exclude *://*.travian*.*/chat/*
// @exclude *://wbb.forum.travian*.*
// @exclude *://*.travian*.*/activate.php*
// @exclude *://*.travian*.*/support.php*
// @exclude *://help.travian*.*
// @exclude *://*.answers.travian*.*
// @exclude *.css
// @exclude *.js
// @grant GM_notification
// @version 0.0.1
// ==/UserScript==

const mainloopIntervalMin = 300000;
const mainLoopIntervalMax = 660000;
const requestIntervalMin = 900;
const requestIntervalMax = 2500;
const resourceFieldNames = [
"puunhakkaaja",
"savimonttu",
"viljapelto",
"rautakaivos",
"woodcutter",
"iron mine",
"clay pit",
"cropland"
];

const newBuildingCosts = {
"9": [1200, 1480, 870, 1600, 4], //Bakery
"6": [440, 480, 320, 50, 3], //Brickyard
"8": [500, 440, 380, 1240, 3], //Grain Mill
"11": [80, 100, 70, 20, 1], //Granary
"7": [200, 450, 510, 120, 6], //Iron foundry
"5": [520, 380, 290, 90, 4], //Sawmill
"10": [130, 160, 90, 40, 1], //Warehouse
"22": [220, 160, 90, 40, 4], //Academy
"13": [180, 250, 500, 160, 4], //Smithy
"19": [210, 140, 260, 120, 4], //Barracks
"37": [700, 670, 700, 240, 2], //Heros mansion
"16": [110, 160, 90, 70, 1], //Rally Point
"20": [260, 140, 220, 100, 5], //Stable
"34": [155, 130, 125, 70, 2], //Stonemasons
"14": [1750, 2250, 1530, 240, 1], //Tournament Square
"21": [460, 510, 600, 320, 3], //Workshop
"23": [40, 50, 30, 10, 4], //Cranny
"18": [180, 130, 150, 80, 3], //Embassy
"17": [80, 70, 120, 70, 4], //Marketplace
"26": [550, 800, 750, 250, 1], //Palace
"25": [580, 460, 350, 180, 1], //Residence
"24": [1250, 1110, 1260, 600, 4], //Town Hall
"28": [1400, 1330, 1200, 400, 3] //Trade Office
};

const buildingNames = {
"9": "Bakery",
"6": "Brickyard",
"8": "Grain Mill",
"11": "Granary",
"7": "Iron Foundry",
"5": "Sawmill",
"10": "Warehouse",
"22": "Academy",
"13": "Smithy",
"19": "Barracks",
"37": "Hero mansion",
"16": "Rally Point",
"20": "Stable",
"34": "Stonemasons",
"14": "Tournament Square",
"21": "Workshop",
"23": "Cranny",
"18": "Embassy",
"17": "Marketplace",
"26": "Palace",
"25": "Residence",
"24": "Town Hall",
"28": "Trade Office"
};

const buildingCategories = {
"9": 3,
"6": 3,
"8": 3,
"11": 1,
"7": 3,
"5": 3,
"10": 1,
"22": 2,
"13": 2,
"19": 2,
"37": 2,
"16": 2,
"20": 2,
"34": 1,
"14": 2,
"21": 2,
"23": 1,
"18": 1,
"17": 1,
"26": 1,
"25": 1,
"24": 1,
"28": 1
};

const unitTiers = {
u1: 1,
u2: 2,
u3: 3,
u4: 4,
u5: 5,
u6: 6,
u7: 7,
u8: 8,
u9: 9,
u10: 10,
u11: 1,
u12: 2,
u13: 3,
u14: 4,
u15: 5,
u16: 6,
u17: 7,
u18: 8,
u19: 9,
u20: 10,
u21: 1,
u22: 2,
u23: 3,
u24: 4,
u25: 5,
u26: 6,
u27: 7,
u28: 8,
u29: 9,
u30: 10,
uhero: 11
};

// --------------------------------------------------------------
// PERSISTENT VARIABLE STORING SYSTEMS

const getStoredVariable = key => {
let vahtiKey = ("TVAHTI_" + key).toLowerCase();
let value = window.localStorage.getItem(vahtiKey);
if (!value || value === "NaN") {
//debugPrint("Couldnt find " + key + " returning null")
return null;
}
return value;
};

const storeVariable = (key, value) => {
let vahtiKey = ("TVAHTI_" + key).toLowerCase();
window.localStorage.setItem(vahtiKey, value);
};

const getAccountVariable = (key, defaultValue = null) => {
let accountId = getWorldId() + "_" + getPlayerId();
let accountKey = (accountId + "_" + key).toLowerCase();
let value = getStoredVariable(accountKey);
if (!value) {
return defaultValue;
}
return value;
};

const setAccountVariable = (key, value) => {
let accountId = getWorldId() + "_" + getPlayerId();
let accountKey = (accountId + "_" + key).toLowerCase();
storeVariable(accountKey, value);
};

// END OF PERSISTENT VARIABLE STORING SYSTEMS
// --------------------------------------------------------------

// --------------------------------------------------------------
// UTILITY FUNCTIONS

const getRequest = url => {
return new Promise(function(resolve, reject) {
let req = new XMLHttpRequest();

req.onload = () => {
if (req.status == 200 || req.status == 302 || req.status == 304) {
debugPrint("Succesfully sent GET request. URL: " + url);
resolve(req.responseText);
} else {
reject(
new Error(
"Failed GET request with status " +
req.status +
": " +
req.statusText
)
);
}
};

req.onerror = () => {
reject(
new Error(
"Failed GET request with status " + req.status + ": " + req.statusText
)
);
};

req.open("GET", url);
req.send();
});
};

const postRequest = (url, parameters) => {
return new Promise(function(resolve, reject) {
let req = new XMLHttpRequest();

let paramArray = [];
for (let key in parameters) {
paramArray.push(key + "=" + parameters[key]);
}
let paramString = paramArray.join("&");
let formattedData = encodeURI(paramString);

req.onload = () => {
if (req.status == 200 || req.status == 302 || req.status == 304) {
debugPrint("Succesfully sent POST request. URL: " + url);
resolve(req.responseText);
} else {
reject(
new Error(
"Failed POST request with status " +
req.status +
": " +
req.statusText
)
);
}
};

req.onerror = () => {
reject(
new Error(
"Failed POST request with status " +
req.status +
": " +
req.statusText
)
);
};

req.open("POST", url);
req.setRequestHeader(
"Content-Type",
"application/x-www-form-urlencoded; charset=UTF-8"
);
req.overrideMimeType("application/xhtml+xml");
req.send(formattedData);
});
};

const randFloat = (min, max) => {
return min + (max - min + 1) * Math.random();
};

const requestDelay = () => {
return Math.round(randFloat(requestIntervalMin, requestIntervalMax));
};

function coordsXYToZ(x, y) {
return (
1 +
(parseInt(x) + getMapRadius()) +
getMapWidth() * Math.abs(parseInt(y) - getMapRadius())
);
}

function coordZToXY(z) {
z = parseInt(z);
var x = ((z - 1) % getMapWidth()) - getMapRadius();
var y = getMapRadius() - parseInt((z - 1) / getMapWidth());
return { x: x, y: y };
}

const calcDistance = (x1, y1, x2, y2) => {
return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
};

const squaredDistance = (x1, y1, x2, y2) => {
return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
};

function delay(ms) {
return function(...args) {
return new Promise(function(resolve, reject) {
setTimeout(function() {
resolve(...args);
}, ms);
});
};
}

// END OF UTILITY FUNCTIONS
// --------------------------------------------------------------

// --------------------------------------------------------------
// BOT MAIN FUNCTIONALITY

const onUnload = evt => {
clearInterval(tryMainTabInterval);
releaseTabId();
if (mainLoopTimeout) clearTimeout(mainLoopTimeout);
};

const tryReserveTabId = () => {
let holderId = parseInt(getAccountVariable("TABID", 0));
if (!holderId || holderId === 0) {
setAccountVariable("TABID", tabId);
return true;
}
return false;
};

const releaseTabId = () => {
let holderId = parseInt(getAccountVariable("TABID", 0));
if (holderId === tabId) {
setAccountVariable("TABID", 0);
}
};

const initialize = () => {
alreadyRunning = 1;

//Create UI stuff
spawnConsole();

if (!getPlayerId()) {
debugPrint("No player ID found. Are we logged in?");
return;
}
if (window.location.href.includes("dorf2")) {
parseBuildingLinksDorf2(document);
}
if (
window.location.href.toLowerCase().includes("dorf1") ||
window.location.href.toLowerCase().includes("dorf2")
) {
spawnBuildingQueue();
}
if (window.location.href.toLowerCase().includes("position_details")) {
spawnFarmList();
addFarmListButtons();
}
if (window.location.href.toLowerCase().includes("tt=99")) {
spawnRaidListButtons();
spawnRaidListUI();
}

replacePlusHotLinks();
createPositionDetailsLink();
spawnTroopTaskButtons();

//Register unload event
window.addEventListener("unload", onUnload, true);
window.addEventListener(
"beforeunload",
event => {
if (isMainLoopRunningNow) {
event.preventDefault();
event.returnValue =
"Main loop is currently running. Are you sure you want to refresh?";
}
},
true
);

if (tryReserveTabId()) {
debugPrint(
"Main tab<br>World: " +
getWorldId() +
"<br>ajax: " +
getAjaxToken() +
"<br>UUID: " +
getPlayerId() +
"<br>Baseurl:" +
getBaseUrl()
);
startMainTabActions();
} else {
debugPrint("Not main tab");
tryMainTabInterval = setInterval(tryToBecomeMainTab, 10000);
}
};

let mainLoopTimeout;

const startMainTabActions = () => {
let lastLoopDateJSON = getAccountVariable("LAST_LOOP_DATE", 0);
let timeSince = 0;
if (lastLoopDateJSON) {
let lastLoopDate = new Date(lastLoopDateJSON);
timeSince = new Date().getTime() - lastLoopDate.getTime();
}
let nextTimeOut = Math.round(
randFloat(mainloopIntervalMin, mainLoopIntervalMax)
);
nextTimeOut -= timeSince;
if (nextTimeOut <= 15000) {
nextTimeOut = 15000;
}

if (timeSince >= 18 * 60 * 60 * 1000) {
setAccountVariable("BUILDINGQUEUE", "");
debugPrint("Reset building queue due to long period of inactivity");
}

debugPrint("Next loop after " + nextTimeOut / 1000 + " seconds.");
mainLoopTimeout = setTimeout(mainLoop, nextTimeOut);
};

let villageList;
let isMainLoopRunningNow = 0;
const mainLoop = async () => {
isMainLoopRunningNow = 1;
reload_enabled = false;
setAccountVariable("LAST_LOOP_DATE", new Date().toJSON());

debugPrint("Running mainloop");
try {
villageList = await fetchAllVillages();
} catch (error) {
debugPrint(error);
villageList = null;
}

if (villageList) {
villageList.forEach(villa =>
debugPrint(
"Parsed " +
villa.name +
" Res: " +
villa.wood +
" / " +
villa.clay +
" / " +
villa.iron +
" / " +
villa.wheat +
" Troops: " +
JSON.stringify(villa.troopArray)
)
);

for (let i = 0; i < villageList.length; i++) {
let iterVillage = villageList[i];
await handleVillageBuilding(iterVillage);
await checkFarmList(iterVillage);
await checkTroopTasks(iterVillage);
}

await checkRaidLists();
}

let nextTimeOut = Math.round(
randFloat(mainloopIntervalMin, mainLoopIntervalMax)
);

debugPrint("Next loop after " + nextTimeOut / 1000 + " seconds.");
mainLoopTimeout = setTimeout(mainLoop, nextTimeOut);
isMainLoopRunningNow = 0;
};

const handleVillageBuilding = async villageListEntry => {
debugPrint("Handling building queue for village " + villageListEntry.name);
let buildingQueue = getBuildingQueue();
buildingQueue = buildingQueue.filter(
bld => bld.villageId === villageListEntry.id
);

if (buildingQueue.length === 0) {
debugPrint("Buildingqueue is empty");
return;
}
let canBuildResourceFields = true;
let canBuildStructures = true;
let nextResourceField;
let nextStructure;
let nextBuilding;
let tribe = getTribeId();
if (tribe === 1) {
//Roman building style
if (villageListEntry.buildQueue.find(obj => obj.isResourceField)) {
canBuildResourceFields = false;
}
if (villageListEntry.buildQueue.find(obj => !obj.isResourceField)) {
canBuildStructures = false;
}
if (canBuildStructures) {
nextStructure = buildingQueue.find(
bld => bld.villageId === villageListEntry.id && !bld.isResourceField
);
}
if (canBuildResourceFields) {
nextResourceField = buildingQueue.find(
bld => bld.villageId === villageListEntry.id && bld.isResourceField
);
}
if (!canBuildResourceFields && !canBuildStructures) {
debugPrint(
"Cannot build in " +
villageListEntry.name +
" (both types building already)"
);
return;
}
} else if (villageListEntry.buildQueue.length > 0) {
debugPrint(
"Cannot build in " + villageListEntry.name + " (already building)"
);
return;
} else {
nextBuilding = buildingQueue.find(
bld => bld.villageId === villageListEntry.id
);
}

if (tribe === 1) {
if (nextStructure) {
try {
await tryToBuild(nextStructure).then(delay(requestDelay()));
} catch (error) {
if (error)
debugPrint(
"Error building " +
JSON.stringify(nextStructure) +
" message: " +
error
);
}
}
if (nextResourceField) {
try {
await tryToBuild(nextResourceField).then(delay(requestDelay()));
} catch (error) {
if (error)
debugPrint(
"Error building " +
JSON.stringify(nextResourceField) +
" message: " +
error
);
}
}
} else if (nextBuilding) {
try {
await tryToBuild(nextBuilding).then(delay(requestDelay()));
} catch (error) {
if (error)
debugPrint(
"Error building " +
JSON.stringify(nextBuilding) +
" message: " +
error
);
}
}
};

const tryToBuild = async buildingObject => {
return new Promise(function(resolve, reject) {
debugPrint("Trying to build " + JSON.stringify(buildingObject));
let bo = buildingObject;
let villageObject = villageList.find(vlg => vlg.id === bo.villageId);

if (bo.buildingCost[0] > 0) {
if (
villageObject.wood < bo.buildingCost[0] ||
villageObject.clay < bo.buildingCost[1] ||
villageObject.iron < bo.buildingCost[2] ||
villageObject.wheat < bo.buildingCost[3] ||
villageObject.buildingCrop < bo.buildingCost[4]
) {
debugPrint("We know we are lacking resources for building.");
reject(null);
return;
} else {
debugPrint("We should have enough resources for building");
}
} else {
debugPrint("Checking to see resource cost of building.");
}

let category = buildingCategories[bo.buildingId] || 1;
let url =
getBaseUrl() +
"build.php?newdid=" +
bo.villageId +
"&id=" +
bo.slotId +
(bo.isUpgrade ? "" : "&category=" + category);

getRequest(url)
.then(delay(requestDelay()))
.then(responseText => {
let respDocument = document.createElement("div");
respDocument.innerHTML = responseText;
if (
!bo.buildingCost ||
bo.buildingCost[0] < 0 ||
bo.buildingCost.length === 0
) {
//Parse cost if we dont know it
let resNodes = respDocument.querySelectorAll(
"#contract > .inlineIconList > .inlineIcon.resource"
);
let resCosts = [];
for (let i = 0; i < resNodes.length; i++) {
resCosts.push(
parseInt(resNodes[i].textContent.replace(/[^\d]/g, ""))
);
}
bo.buildingCost = resCosts;
modifyBuildingQueue(bo);
}

//Check to see that we know the resource cost now
if (bo.buildingCost[0] < 0) {
debugPrint("Failed at parsing resource cost for building");
reject(new Error("Couldnt find out cost of building"));
return null;
}

debugPrint("Building costs " + JSON.stringify(bo.buildingCost));

if (
villageObject.wood < bo.buildingCost[0] ||
villageObject.clay < bo.buildingCost[1] ||
villageObject.iron < bo.buildingCost[2] ||
villageObject.wheat < bo.buildingCost[3] ||
villageObject.buildingCrop < bo.buildingCost[4]
) {
debugPrint("We are lacking resources for building.");
return Promise.reject(null);
}

//Find checksum
let checksum;
let buttons = respDocument.querySelectorAll(".green.build");

//Look for checksum in "upgrade building" buttons
for (let i = 0; i < buttons.length; i++) {
let btn = buttons[i];
if (!btn.getAttribute("onclick")) continue;
checksum = btn
.getAttribute("onclick")
.toString()
.toLowerCase()
.match("c=(.+)'")[1];
if (checksum) {
debugPrint("Found checksum (upgrade)");
break;
}
}

//Look for checksum in "new building" buttons if not found before
let isNewBuilding = false;
if (!checksum) {
buttons = respDocument.querySelectorAll(".green.new");
for (let i = 0; i < buttons.length; i++) {
let btn = buttons[i];
if (!btn.getAttribute("onclick")) continue;
checksum = btn
.getAttribute("onclick")
.toString()
.toLowerCase()
.match("c=(.+)'")[1];
if (checksum) {
debugPrint("Found checksum (new building)");
isNewBuilding = true;
break;
}
}
}

if (!checksum) {
debugPrint("Couldnt build building! No resources / queue full?");
return Promise.reject(null);
}

//Send actual build button request
let buildurl =
getBaseUrl() +
"dorf" +
(bo.isResourceField ? 1 : 2) +
".php?a=" +
bo.slotId +
"&c=" +
checksum;
if (isNewBuilding) {
buildurl =
getBaseUrl() +
"dorf2.php?a=" +
bo.buildingId +
"&id=" +
bo.slotId +
"&c=" +
checksum;
}

return getRequest(buildurl);
})
.then(delay(requestDelay()))
.then(responseText => {
debugPrint("Succesfully sent build request!");
removeQueuedBuilding(bo.identifier);
if (buildingQueue) spawnBuildingQueue();
if (bo.isResourceField) {
renderAfterFetch(responseText);
} else {
renderAfterBuild(responseText);
}
villageObject.wood -= bo.buildingCost[0];
villageObject.clay -= bo.buildingCost[1];
villageObject.iron -= bo.buildingCost[2];
villageObject.wheat -= bo.buildingCost[3];
villageObject.buildingCrop -= bo.buildingCost[4];
resolve(true);
return;
})
.catch(error => {
if (!error) {
reject(null);
return;
}
reject(new Error(error));
});
});
};

const renderAfterBuild = responseText => {
if (
!window.location.href.includes("dorf1") &&
!window.location.href.includes("dorf2")
)
return;

let respDocument = document.createElement("div");
respDocument.innerHTML = responseText;
let activeDocumentVillage = getActiveVillageId(respDocument);
if (activeDocumentVillage !== getActiveVillageId(document)) return;

let newList = respDocument.querySelector("div.boxes.buildingList");
let oldList = document.querySelector("div.boxes.buildingList");
if (oldList && newList) {
oldList.parentNode.replaceChild(newList, oldList);
} else if (newList) {
document.querySelector("#content").appendChild(newList);
}
if (newList) {
let timers = newList.querySelectorAll(".timer");
for (let i = 0; i < timers.length; i++) {
let t = timers[i];
startCrawledTimer(t);
}
}

let oldStock = document.querySelector("#stockBar");
let newStock = respDocument.querySelector("#stockBar");

if (oldStock && newStock) {
oldStock.parentNode.replaceChild(newStock, oldStock);
}
};

const renderAfterFetch = responseText => {
let respDocument = document.createElement("div");
respDocument.innerHTML = responseText;
let activeDocumentVillage = getActiveVillageId(respDocument);
if (activeDocumentVillage !== getActiveVillageId(document)) return;

if (window.location.href.includes("dorf1")) {
//Update troops list
let oldTroops = document.querySelector("#troops");
let newTroops = respDocument.querySelector("#troops");
if (oldTroops && newTroops) {
oldTroops.parentNode.replaceChild(newTroops, oldTroops);
}

//Update troop movements
oldMovements = document.querySelector("#movements");
if (oldMovements) {
newMovements = respDocument.querySelector("#movements");
if (newMovements) {
let timers = newMovements.querySelectorAll(".timer");
oldMovements.parentNode.replaceChild(newMovements, oldMovements);
for (let i = 0; i < timers.length; i++) {
let t = timers[i];
startCrawledTimer(t);
}
}
}
}

if (
window.location.href.includes("dorf2") ||
window.location.href.includes("dorf1")
) {
//Update build queue
let newList = respDocument.querySelector("div.boxes.buildingList");
let oldList = document.querySelector("div.boxes.buildingList");
if (oldList && newList) {
oldList.parentNode.replaceChild(newList, oldList);
} else if (newList) {
if (!document.querySelector("#content")) debugPrint("Content not found!");
document.querySelector("#content").appendChild(newList);
}
if (newList) {
let timers = newList.querySelectorAll(".timer");
for (let i = 0; i < timers.length; i++) {
let t = timers[i];
startCrawledTimer(t);
}
}

//Update resource stockbar
let oldStock = document.querySelector("#stockBar");
let newStock = respDocument.querySelector("#stockBar");
if (oldStock && newStock) {
oldStock.parentNode.replaceChild(newStock, oldStock);
}
}
};

const fetchAllVillages = async () => {
let villageList = getVillageList(document);
for (let i = 0; i < villageList.length; i++) {
let iterVillage = villageList[i];
let iterVillageResources;
try {
iterVillageResources = await fetchVillageResources(iterVillage).then(
delay(requestDelay())
);
} catch (error) {
throw new Error("Error fetching village resources: " + error);
}

Object.assign(iterVillage, iterVillageResources);
}

return villageList;
};

const fetchVillageResources = villageObject => {
return new Promise(function(resolve, reject) {
let url = villageObject.activationUrl;
getRequest(url)
.then(responseText => {
renderAfterFetch(responseText);
resolve(parseVillageResourcesFromResponse(responseText));
return;
})
.catch(error => {
reject(new Error(error));
});
});
};

const parseVillageResourcesFromResponse = responseText => {
let respDocument = document.createElement("div");
respDocument.innerHTML = responseText;

//Parse building queue
let buildQueue = [];
let buildQueueNames = respDocument.querySelectorAll(
"div.buildingList > .boxes-contents > ul > li > .name"
);
let buildQueueDurations = respDocument.querySelectorAll(
"div.buildingList > .boxes-contents > ul > li > .buildDuration > span"
);
for (let i = 0; i < buildQueueNames.length; i++) {
let name = buildQueueNames[i].innerHTML
.match(/(.+)<span/)[1]
.replace(/[\t\n]/g, "")
.toLowerCase();
let duration = buildQueueDurations[i].textContent;
let splitDuration = duration.split(":");
let hours = parseInt(splitDuration[0]);
let minutes = parseInt(splitDuration[1]);
let seconds = parseInt(splitDuration[2]);
let finishDate = new Date(
new Date().getTime() +
hours * 60 * 60 * 1000 +
minutes * 60 * 1000 +
seconds * 1000
);

let isResourceField = 0;
resourceFieldNames.forEach(fname => {
if (name.includes(fname)) {
isResourceField = 1;
}
});

buildQueue.push({
name: name,
finishDate: finishDate,
isResourceField: isResourceField
});
}
//Finish parsing build queue

//Parse resources
let wood = respDocument
.querySelector("#stockBarResource1")
.textContent.replace(/[^\d]/g, "");
let clay = respDocument
.querySelector("#stockBarResource2")
.textContent.replace(/[^\d]/g, "");
let iron = respDocument
.querySelector("#stockBarResource3")
.textContent.replace(/[^\d]/g, "");
let wheat = respDocument
.querySelector("#stockBarResource4")
.textContent.replace(/[^\d]/g, "");
let buildingCrop = respDocument
.querySelector("#stockBarFreeCropWrapper")
.textContent.replace(/[^\d]/g, "");
let granarySpace = respDocument
.querySelector("#stockBarGranaryWrapper")
.textContent.replace(/[^\d]/g, "");
let warehouseSpace = respDocument
.querySelector("#stockBarWarehouseWrapper")
.textContent.replace(/[^\d]/g, "");
wood = parseInt(wood);
clay = parseInt(clay);
iron = parseInt(iron);
wheat = parseInt(wheat);
buildingCrop = parseInt(buildingCrop);
granarySpace = parseInt(granarySpace);
warehouseSpace = parseInt(warehouseSpace);
/// Finish parsing resources

//Parse troops
let troops = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let amounts = respDocument.querySelectorAll("#troops > tbody > tr > td.num");
let types = respDocument.querySelectorAll(
"#troops > tbody > tr > td.ico > a > img"
);
for (let i = 0; i < amounts.length; i++) {
let match = types[i].className.match(/(u\d+)/);
if (!match) {
match = types[i].className.match(/(uhero)/);
}
let type = match[1];
let tier = unitTiers[type];
let amount = parseInt(amounts[i].textContent.replace(/[^\d]/g, ""));
troops[tier - 1] = amount;
}
//Finish parsing troops

let villageResObject = {
wood: wood,
clay: clay,
iron: iron,
wheat: wheat,
granarySpace: granarySpace,
warehouseSpace: warehouseSpace,
buildingCrop: buildingCrop,
buildQueue: buildQueue,
troopArray: troops
};

return villageResObject;
};

const getBuildingQueue = () => {
let buildingQueue = getAccountVariable("BUILDINGQUEUE", 0);
if (!buildingQueue) {
buildingQueue = [];
} else {
buildingQueue = JSON.parse(buildingQueue);
}

buildingQueue = buildingQueue.map(strBld => {
return {
slotId: parseInt(strBld.slotId),
buildingId: parseInt(strBld.buildingId),
buildingCost: strBld.buildingCost.map(cost => parseInt(cost)),
villageId: parseInt(strBld.villageId),
isResourceField: parseInt(strBld.isResourceField),
isUpgrade: strBld.isUpgrade ? parseInt(strBld.isUpgrade) : 0,
identifier: parseInt(strBld.identifier)
};
});

return buildingQueue;
};

const getFarmList = () => {
let farmList = getAccountVariable("FARMLIST", 0);
if (!farmList) {
farmList = [];
} else {
farmList = JSON.parse(farmList);
}

farmList = farmList.map(farm => {
return {
fromVillage: parseInt(farm.fromVillage),
targetZ: parseInt(farm.targetZ),
targetName: farm.targetName,
troopArray: farm.troopArray.map(entry => parseInt(entry)),
interval: parseInt(farm.interval),
randomness: parseInt(farm.randomness),
lastFarmed: farm.lastFarmed ? new Date(farm.lastFarmed) : null,
isPaused: parseInt(farm.isPaused),
hasThreat: parseInt(farm.hasThreat),
nextRandomWait: parseInt(farm.nextRandomWait)
};
});

return farmList;
};

const getTroopTasks = () => {
let troopTasks = getAccountVariable("TROOPTASKS", 0);
if (!troopTasks) {
return [];
} else {
troopTasks = JSON.parse(troopTasks);
}

troopTasks = troopTasks.map(task => {
return {
interval: parseInt(task.interval),
minimumTime: parseInt(task.minimumTime),
troopsToTrain: parseInt(task.troopsToTrain),
villageId: parseInt(task.villageId),
buildingSlot: parseInt(task.buildingSlot),
buildingLink: task.buildingLink,
troopTier: parseInt(task.troopTier),
lastChecked: task.lastChecked ? new Date(task.lastChecked) : null
};
});

return troopTasks;
};

const addTroopTask = (
interval,
minimumTime,
troopsToTrain,
villageId,
buildingSlot,
troopTier
) => {
let troopTasks = getTroopTasks();

let previous = troopTasks.findIndex(
task =>
task.villageId === parseInt(villageId) &&
task.buildingSlot === parseInt(buildingSlot)
);
if (previous >= 0) {
troopTasks.splice(previous, 1);
debugPrint("Replacing existing troop task entry");
}

let newTask = {
interval: interval,
minimumTime: minimumTime,
troopsToTrain: troopsToTrain,
villageId: villageId,
buildingSlot: buildingSlot,
buildingLink:
getBaseUrl() + "build.php?id=" + buildingSlot + "&newdid=" + villageId,
troopTier: troopTier,
lastChecked: null
};

troopTasks.push(newTask);
setAccountVariable("TROOPTASKS", JSON.stringify(troopTasks));
debugPrint("Added troop task " + JSON.stringify(newTask));
};

const modifyTroopTask = troopTaskObject => {
let troopTasks = getTroopTasks();

let previous = troopTasks.findIndex(
task =>
task.villageId === troopTaskObject.villageId &&
task.buildingSlot === troopTaskObject.buildingSlot
);
if (previous >= 0) {
troopTasks.splice(previous, 1);
troopTasks.push(troopTaskObject);
setAccountVariable("TROOPTASKS", JSON.stringify(troopTasks));
} else {
debugPrint("Cannot find trooptask to modify!");
}
};

const deleteTroopTask = (villageId, buildingSlot) => {
let troopTasks = getTroopTasks();
let found = troopTasks.findIndex(
task =>
task.villageId === parseInt(villageId) &&
task.buildingSlot === parseInt(buildingSlot)
);

if (found >= 0) {
troopTasks.splice(found, 1);
} else {
debugPrint("Cannot find trooptask to delete!");
return;
}

setAccountVariable("TROOPTASKS", JSON.stringify(troopTasks));
};

const getRaidListEntries = () => {
let raidLists = getAccountVariable("RAIDLISTS", 0);
if (!raidLists) {
raidLists = [];
} else {
raidLists = JSON.parse(raidLists);
}

return raidLists;
};

const addRaidListEntry = (listId, listName) => {
let raidLists = getRaidListEntries();

let newListEntry = {
listName: listName,
listId: listId
};

let previous = raidLists.findIndex(list => list.listId === listId);

if (previous >= 0) {
debugPrint("Replacing existing raidList entry!");
raidLists.splice(previous, 1);
}

raidLists.push(newListEntry);
setAccountVariable("RAIDLISTS", JSON.stringify(raidLists));
};

const deleteRaidListEntry = listId => {
let raidLists = getRaidListEntries();

let previous = raidLists.findIndex(list => list.listId === listId);

if (previous >= 0) {
raidLists.splice(previous, 1);
} else {
debugPrint("Unable to find raidlist to delete");
return;
}

setAccountVariable("RAIDLISTS", JSON.stringify(raidLists));
};

const getRaidListTimeData = () => {
let raidListTimes = getAccountVariable("RAIDLIST_TIMES", 0);
if (!raidListTimes) {
return null;
} else {
raidListTimes = JSON.parse(raidListTimes);
raidListTimes = {
enabled: parseInt(raidListTimes.enabled),
interval: parseInt(raidListTimes.interval),
randomness: parseInt(raidListTimes.randomness),
lastSent: raidListTimes.lastSent
? new Date(raidListTimes.lastSent)
: null,
nextRandomWait: raidListTimes.nextRandomWait
};
}

return raidListTimes;
};

const saveRaidListTimeData = timeData => {
setAccountVariable("RAIDLIST_TIMES", JSON.stringify(timeData));
};

const addFarmListEntry = (
fromVillage,
targetZ,
targetName,
troopArray,
interval,
randomness
) => {
let farmList = getFarmList();

let newFarm = {
fromVillage: fromVillage,
targetZ: targetZ,
targetName: targetName,
troopArray: troopArray,
interval: interval,
randomness: randomness,
lastFarmed: null,
isPaused: 0,
hasThreat: 0,
nextRandomWait: Math.round(randFloat(-randomness, randomness))
};

let previous = farmList.findIndex(
farm =>
parseInt(farm.fromVillage) === fromVillage &&
parseInt(farm.targetZ) === targetZ
);

if (previous >= 0) {
debugPrint("Replacing existing farmlist entry!");
newFarm.lastFarmed = farmList[previous].lastFarmed;
farmList.splice(previous, 1);
}

farmList.push(newFarm);
setAccountVariable("FARMLIST", JSON.stringify(farmList));
};
const modifyFarmListEntry = newFarm => {
let farmList = getFarmList();
let found = farmList.find(
old =>
newFarm.fromVillage === old.fromVillage && newFarm.targetZ === old.targetZ
);
if (found) {
Object.assign(found, newFarm);
setAccountVariable("FARMLIST", JSON.stringify(farmList));
} else {
debugPrint(
"Couldnt find farmlist entry to modify! Looking for " +
JSON.stringify(newFarm)
);
}
};

const deleteFarmlistEntry = (fromVillage, targetZ) => {
let farmList = getFarmList();
let farm = farmList.findIndex(
f =>
parseInt(f.fromVillage) === parseInt(fromVillage) &&
parseInt(f.targetZ) === parseInt(targetZ)
);
if (farm >= 0) {
farmList.splice(farm, 1);
setAccountVariable("FARMLIST", JSON.stringify(farmList));
return;
}
debugPrint("Failed to find farm to delete");
};

const checkRaidLists = async () => {
let timeData = getRaidListTimeData();
let entries = getRaidListEntries();
if (!timeData || !timeData.enabled) {
return;
}
if (entries.length === 0) {
debugPrint("No raidlists added for sending");
return;
}

debugPrint("Checking if we have to send raidlists");
let timeSince;
if (timeData.lastSent) {
timeSince = new Date(new Date().getTime() - timeData.lastSent.getTime());
}

if (!timeSince || timeSince > timeData.interval + timeData.nextRandomWait) {
debugPrint("Sending raid lists");
timeData.lastSent = new Date();
timeData.nextRandomWait = Math.round(
randFloat(-timeData.randomness, timeData.randomness)
);
saveRaidListTimeData(timeData);

let raidLists = getRaidListEntries();
previousResponse = null;
for (let i = 0; i < raidLists.length; i++) {
try {
await sendRaidList(raidLists[i]).then(delay(requestDelay()));
} catch (error) {
if (!error) return;
debugPrint("Error sending raid lists: " + error);
return;
}
}
}
};

let previousResponse;
const getOrUsePrevious = url => {
if (!previousResponse) {
debugPrint("Opening raid list page");
return getRequest(url);
} else {
debugPrint("Using previous response raid list page");
return Promise.resolve(previousResponse);
}
};

const sendRaidList = async listEntry => {
debugPrint("Sendraidlist " + listEntry.listName);
let villageList = getVillageList(document);
let firstVillageId = villageList[0].id;
let url = getBaseUrl() + "build.php?tt=99&id=39&newdid=" + firstVillageId;

return getOrUsePrevious(url)
.then(delay(requestDelay()))
.then(responseText => {
let responseDocument = document.createElement("div");
responseDocument.innerHTML = responseText;
let list = responseDocument.querySelector("#" + listEntry.listId);
if (!list) {
return Promise.reject(
new Error("Unable to find raidlist with id " + listEntry.listId)
);
}

let rows = list.querySelectorAll(
"form > .listContent > .detail > .list > tbody > tr"
);

let action;
let a;
let sort;
let direction;
let lid;

let inputs = list.querySelectorAll("form > input");
for (let input = 0; input < inputs.length; input++) {
let iterInput = inputs[input];
if (iterInput.getAttribute("name").toLowerCase() === "action") {
action = iterInput.value;
}
if (iterInput.getAttribute("name").toLowerCase() === "a") {
a = iterInput.value;
}
if (iterInput.getAttribute("name").toLowerCase() === "sort") {
sort = iterInput.value;
}
if (iterInput.getAttribute("name").toLowerCase() === "direction") {
direction = iterInput.value;
}
if (iterInput.getAttribute("name").toLowerCase() === "lid") {
lid = iterInput.value;
}
}

if (!action || !a || !sort || !direction || !lid) {
return Promise.reject(
new Error("Unable to find required post parameters")
);
}

let postData = {
action: action,
a: a,
sort: sort,
direction: direction,
lid: lid
};

for (let r = 0; r < rows.length; r++) {
let iterRow = rows[r];
let checkBox = iterRow.getElementsByClassName("checkbox")[0];
let checkBoxName = checkBox
.getElementsByTagName("input")[0]
.getAttribute("name");
let hasThreat = /iReport2|iReport3/.test(
iterRow.getElementsByClassName("lastRaid")[0].innerHTML
);

if (!hasThreat) {
postData[checkBoxName] = "on";
}
}

let postUrl = getBaseUrl() + "build.php?gid=16&tt=99";
return postRequest(postUrl, postData);
})
.then(responseText => {
debugPrint(
"Sent raidlist " +
listEntry.listName +
" (id: " +
listEntry.listId +
")"
);
previousResponse = responseText;
})
.catch(error => {
throw new Error(error);
});
};

const checkTroopTasks = async villageObject => {
debugPrint(
"Checking troop tasks for village" +
villageObject.name +
" id: " +
villageObject.id
);
let villageTroopTasks = getTroopTasks().filter(
task => task.villageId === villageObject.id
);

if (!villageTroopTasks || villageTroopTasks.length === 0) return;

for (let i = 0; i < villageTroopTasks.length; i++) {
let iterTask = villageTroopTasks[i];
let lastChecked = iterTask.lastChecked;
let currentDate = new Date();
if (
!lastChecked ||
currentDate.getTime() - lastChecked.getTime() > iterTask.interval
) {
debugPrint(
"Checking troop queue for building slot " + iterTask.buildingSlot
);
iterTask.lastChecked = currentDate;
modifyTroopTask(iterTask);

//Check task stuff
// TODO
}
}
};

const checkFarmList = async villageObject => {
debugPrint("Checking farmlist for village " + villageObject.name);
let villageFarmList = getFarmList().filter(
farm => farm.fromVillage === villageObject.id
);

villageFarmList.sort((a, b) => {
aCoords = coordZToXY(a.targetZ);
bCoords = coordZToXY(b.targetZ);
aDistSq = squaredDistance(
aCoords.x,
aCoords.y,
villageObject.x,
villageObject.y
);
bDistSq = squaredDistance(
bCoords.x,
bCoords.y,
villageObject.x,
villageObject.y
);
return aDistSq - bDistSq;
});

for (let i = 0; i < villageFarmList.length; i++) {
let iterFarm = villageFarmList[i];
if (iterFarm.isPaused) continue;

let haveTroops = true;
for (
let iterTroop = 0;
iterTroop < iterFarm.troopArray.length;
iterTroop++
) {
if (
iterFarm.troopArray[iterTroop] > villageObject.troopArray[iterTroop]
) {
haveTroops = false;
break;
}
}
if (!haveTroops) continue;

if (iterFarm.lastFarmed) {
let farmedDate = new Date(iterFarm.lastFarmed);
let timeSince = new Date().getTime() - farmedDate.getTime();
if (timeSince < iterFarm.nextRandomWait + iterFarm.interval) {
continue;
}
}

try {
await farmTarget(iterFarm, villageObject).then(delay(requestDelay()));
} catch (error) {
if (error)
debugPrint(
"Couldnt farm target: " + iterFarm.targetName + " message: " + error
);
}
}
};

const farmTarget = async (farmObject, villageObject) => {
return new Promise((resolve, reject) => {
let coords = coordZToXY(farmObject.targetZ);
let getUrl =
getBaseUrl() + "position_details.php?x=" + coords.x + "&y=" + coords.y;
debugPrint("Checking farm " + farmObject.targetName + " for threats");

getRequest(getUrl)
.then(delay(requestDelay()))
.then(responseText => {
//Check farm for threats
let respDocument = document.createElement("div");
respDocument.innerHTML = responseText;
let hasThreats = false;
let isOasis;
if (respDocument.querySelector("#oasis1InstantTabs")) isOasis = true;
if (isOasis) {
if (respDocument.querySelector("#troop_info > tbody > tr > .val"))
hasThreats = true;
} else {
let firstReport = respDocument.querySelector(".iReport");
if (firstReport) {
if (
firstReport.className.toLowerCase().includes("ireport2") ||
firstReport.className.toLowerCase().includes("ireport3")
) {
hasThreats = true;
}
}
}

if (hasThreats) {
debugPrint("Threat detected in farm " + farmObject.targetName);
farmObject.hasThreat = 1;
farmObject.lastFarmed = new Date();
farmObject.nextRandomWait = farmObject.interval;
modifyFarmListEntry(farmObject);
return Promise.reject(null);
} else {
debugPrint("No threats detected in farm " + farmObject.targetName);
farmObject.hasThreat = 0;
modifyFarmListEntry(farmObject);
}

//Open rally point to send troops
let troopString = "";
for (
let troopTier = 0;
troopTier < farmObject.troopArray.length;
troopTier++
) {
if (farmObject.troopArray[troopTier] > 0) {
troopString +=
"&t" + (troopTier + 1) + "=" + farmObject.troopArray[troopTier];
}
}

let rallyUrl =
getBaseUrl() +
"/build.php?id=39&tt=2&z=" +
farmObject.targetZ +
"&newdid=" +
farmObject.fromVillage +
troopString;

return getRequest(rallyUrl);
})
.then(delay(requestDelay()))
.then(responseText => {
if (!responseText) return null;
//Open confirmation window
let respDocument = document.createElement("div");
respDocument.innerHTML = responseText;
let hiddenInputs = respDocument.querySelectorAll(
".a2b > form:nth-child(1) > input"
);
let timestamp;
let timestamp_checksum;
let b;
let currentDid;
for (let i = 0; i < hiddenInputs.length; i++) {
let hInput = hiddenInputs[i];
if (hInput.getAttribute("name").toLowerCase() === "timestamp") {
timestamp = hInput.getAttribute("value");
} else if (
hInput.getAttribute("name").toLowerCase() === "timestamp_checksum"
) {
timestamp_checksum = hInput.getAttribute("value");
} else if (
hInput.getAttribute("name").toLowerCase() === "currentdid"
) {
currentDid = hInput.getAttribute("value");
} else if (hInput.getAttribute("name").toLowerCase() === "b") {
b = hInput.getAttribute("value");
}
}

let postUrl = getBaseUrl() + "build.php?gid=16&tt=2";
let postData = {
timestamp: timestamp,
timestamp_checksum: timestamp_checksum,
b: b,
currentDid: currentDid,
t1: farmObject.troopArray[0],
t2: farmObject.troopArray[1],
t3: farmObject.troopArray[2],
t4: farmObject.troopArray[3],
t5: farmObject.troopArray[4],
t6: farmObject.troopArray[5],
t7: farmObject.troopArray[6],
t8: farmObject.troopArray[7],
t9: farmObject.troopArray[8],
t10: farmObject.troopArray[9],
t11: farmObject.troopArray[10],
dname: "",
x: coords.x,
y: coords.y,
c: 4,
s1: "ok"
};
return postRequest(postUrl, postData);
})
.then(delay(requestDelay()))
.then(responseText => {
if (!responseText) return null;
//Send confirmation to attack
let respDocument = document.createElement("div");
respDocument.innerHTML = responseText;

if (respDocument.querySelector(".error")) {
debugPrint(
"Cannot send troops to farm " +
+farmObject.targetName +
". Pausing farm. Message: " +
respDocument.querySelector(".error").textContent
);
farmObject.isPaused = 1;
modifyFarmListEntry(farmObject);
return Promise.reject(
new Error(respDocument.querySelector(".error").textContent)
);
}

let timestamp;
let timestamp_checksum;
let redeployHero;
let id;
let a;
let kid;
let sendReally;
let troopsSent;
let currentDid;
let b;
let hiddenInputs = respDocument.querySelectorAll(
".a2b > form:nth-child(1) > input"
);
for (let i = 0; i < hiddenInputs.length; i++) {
let hInput = hiddenInputs[i];
if (
hInput.getAttribute("name").toLowerCase() === "timestamp_checksum"
) {
timestamp_checksum = hInput.getAttribute("value");
} else if (
hInput.getAttribute("name").toLowerCase() === "timestamp"
) {
timestamp = hInput.getAttribute("value");
} else if (
hInput.getAttribute("name").toLowerCase() === "redeployhero"
) {
redeployHero = hInput.getAttribute("value");
} else if (hInput.getAttribute("name").toLowerCase() === "id") {
id = hInput.getAttribute("value");
} else if (hInput.getAttribute("name").toLowerCase() === "a") {
a = hInput.getAttribute("value");
} else if (hInput.getAttribute("name").toLowerCase() === "kid") {
kid = hInput.getAttribute("value");
} else if (
hInput.getAttribute("name").toLowerCase() === "sendreally"
) {
sendReally = hInput.getAttribute("value");
} else if (
hInput.getAttribute("name").toLowerCase() === "troopssent"
) {
troopsSent = hInput.getAttribute("value");
} else if (
hInput.getAttribute("name").toLowerCase() === "currentdid"
) {
currentDid = hInput.getAttribute("value");
} else if (hInput.getAttribute("name").toLowerCase() === "b") {
b = hInput.getAttribute("value");
}
}

let postUrl = getBaseUrl() + "build.php?gid=16&tt=2";
let postData = {
redeployHero: redeployHero,
timestamp: timestamp,
timestamp_checksum: timestamp_checksum,
id: id,
a: a,
c: 4,
kid: kid,
t1: farmObject.troopArray[0],
t2: farmObject.troopArray[1],
t3: farmObject.troopArray[2],
t4: farmObject.troopArray[3],
t5: farmObject.troopArray[4],
t6: farmObject.troopArray[5],
t7: farmObject.troopArray[6],
t8: farmObject.troopArray[7],
t9: farmObject.troopArray[8],
t10: farmObject.troopArray[9],
t11: farmObject.troopArray[10],
sendReally: sendReally,
troopsSent: troopsSent,
currentDid: currentDid,
b: b,
dname: "",
x: coords.x,
y: coords.y,
s1: "ok"
};

return postRequest(postUrl, postData);
})
.then(responseText => {
if (!responseText) return null;
debugPrint("Sent attack to " + farmObject.targetName);
for (
let iTroop = 0;
iTroop < villageObject.troopArray.length;
iTroop++
) {
villageObject.troopArray[iTroop] -= farmObject.troopArray[iTroop];
}
farmObject.lastFarmed = new Date();
farmObject.nextRandomWait = Math.round(
randFloat(-farmObject.randomness, farmObject.randomness)
);
modifyFarmListEntry(farmObject);
resolve(true);
})
.catch(error => {
if (!error) {
reject(null);
return;
}
reject(new Error(error));
});
});
};

const queueBuilding = (
villageId,
slotId,
buildingId,
buildingCost,
isUpgrade
) => {
let buildingQueue = getBuildingQueue();
let newBuilding = {
slotId: parseInt(slotId),
buildingId: parseInt(buildingId),
buildingCost: buildingCost ? buildingCost : [-1, -1, -1, -1, -1],
villageId: parseInt(villageId),
isResourceField: parseInt(slotId) <= 18 ? 1 : 0,
isUpgrade: parseInt(isUpgrade),
identifier: Math.round(randFloat(0, 100000000))
};

buildingQueue.push(newBuilding);

setAccountVariable("BUILDINGQUEUE", JSON.stringify(buildingQueue));
};

const removeQueuedBuilding = identifier => {
let queue = getBuildingQueue();
let removeIndex = queue.findIndex(
bld => parseInt(identifier) === bld.identifier
);
queue.splice(removeIndex, 1);
setAccountVariable("BUILDINGQUEUE", JSON.stringify(queue));
if (buildingQueue) spawnBuildingQueue();
};

const modifyBuildingQueue = buildingObject => {
let queue = getBuildingQueue();
let found = queue.find(b => buildingObject.identifier === b.identifier);
if (found) {
Object.assign(found, buildingObject);
setAccountVariable("BUILDINGQUEUE", JSON.stringify(queue));
} else {
debugPrint(
"Couldnt find building to modify! Looking for " +
JSON.stringify(buildingObject)
);
}
};

let tryMainTabInterval;
const tryToBecomeMainTab = () => {
if (tryReserveTabId()) {
clearInterval(tryMainTabInterval);
debugPrint("This tab became the main tab!");
startMainTabActions();
}
};

const parseBuildingLinksDorf2 = doc => {
let buildingSlots = doc.querySelectorAll(".buildingSlot");
let villageId = getActiveVillageId(doc);
let barracks;
let greatbarracks;
let stable;
let greatstable;
let workshop;
let marketplace;

for (let i = 0; i < buildingSlots.length; i++) {
let iterSlot = buildingSlots[i];
let slotIdMatch = iterSlot.className.match(/a(\d+)/);
let buildingIdMatch = iterSlot.className.match(/g(\d+)/);
let slotId;
let buildingId;
if (slotIdMatch) slotId = parseInt(slotIdMatch[1]);
if (buildingIdMatch) buildingId = parseInt(buildingIdMatch[1]);

if (slotId && buildingId) {
if (buildingId === 19) {
barracks =
getBaseUrl() + "build.php?id=" + slotId + "&newdid=" + villageId;
} else if (buildingId === 20) {
stable =
getBaseUrl() + "build.php?id=" + slotId + "&newdid=" + villageId;
} else if (buildingId === 21) {
workshop =
getBaseUrl() + "build.php?id=" + slotId + "&newdid=" + villageId;
} else if (buildingId === 17) {
marketplace =
getBaseUrl() + "build.php?id=" + slotId + "&newdid=" + villageId;
} else if (buildingId === 29) {
greatbarracks =
getBaseUrl() + "build.php?id=" + slotId + "&newdid=" + villageId;
} else if (buildingId === 30) {
greatstable =
getBaseUrl() + "build.php?id=" + slotId + "&newdid=" + villageId;
}
}
}

let buildingLinksObject = {
barracks: barracks,
stable: stable,
workshop: workshop,
marketplace: marketplace,
greatbarracks: greatbarracks,
greatstable: greatstable
};

let links = getStoredBuildingLinks();
links[villageId] = buildingLinksObject;
setAccountVariable("BUILDINGLINKS", JSON.stringify(links));
};

const getStoredBuildingLinks = () => {
let links = getAccountVariable("BUILDINGLINKS", 0);
if (!links) return {};
links = JSON.parse(links);
return links;
};

const getVillageList = doc => {
//Coords
let coordsX = doc.querySelectorAll(
"#sidebarBoxVillagelist > div.sidebarBoxInnerBox > div.innerBox.content > ul > li > a > span > span.coordinateX"
);
let coordsY = doc.querySelectorAll(
"#sidebarBoxVillagelist > div.sidebarBoxInnerBox > div.innerBox.content > ul > li > a > span > span.coordinateY"
);

let names = doc.querySelectorAll(
"#sidebarBoxVillagelist > div:nth-child(2) > div:nth-child(2) > ul:nth-child(1) > li > a > .name"
);
let idLinks = doc.querySelectorAll(
"#sidebarBoxVillagelist > div:nth-child(2) > div:nth-child(2) > ul:nth-child(1) > li > a"
);

let villageList = [];
for (let i = 0; i < names.length; i++) {
let name = names[i].innerHTML;
let link = idLinks[i].href.toString().toLowerCase();
let isActive = idLinks[i].className.includes("active");
let id = parseInt(link.match("newdid=([0-9]*)")[1]);
let xCoord = parseInt(coordsX[i].textContent.toString().match(/(\d+)/)[1]);
let yCoord = parseInt(coordsY[i].textContent.toString().match(/(\d+)/)[1]);
if (/[\-\−]/.test(coordsX[i].textContent)) {
xCoord = -xCoord;
}
if (/[\-\−]/.test(coordsY[i].textContent)) {
yCoord = -yCoord;
}
let villageObject = {
name: name,
id: id,
activationUrl: getBaseUrl() + "dorf1.php?newdid=" + id + "&",
x: xCoord,
y: yCoord
};

villageList.push(villageObject);
}

return villageList;
};

const getActiveVillageId = doc => {
let activeLink = doc.querySelector(
"#sidebarBoxVillagelist > div:nth-child(2) > div:nth-child(2) > ul:nth-child(1) > li > a.active"
);

if (!activeLink) return null;
let link = activeLink.href.toString().toLowerCase();
let activeid = parseInt(link.match("newdid=([0-9]*)")[1]);
return activeid;
};

let worldId;
const getWorldId = () => {
if (worldId) return worldId;
try {
worldId = unsafeWindow.Travian.Game.worldId;
} catch {
return null;
}
return worldId;
};

let ajaxToken;
const getAjaxToken = () => {
if (ajaxToken) return ajaxToken;
try {
ajaxToken = unsafeWindow.ajaxToken;
} catch {
return null;
}
return ajaxToken;
};

let uuid;
const getPlayerId = () => {
if (uuid) return uuid;
try {
uuid = unsafeWindow._player_uuid;
} catch {
return null;
}
return uuid;
};

let mapWidth;
const getMapWidth = () => {
if (mapWidth) return mapWidth;
mapWidth = unsafeWindow.TravianDefaults.Map.Size.width;
return mapWidth;
};

let mapRadius;
const getMapRadius = () => {
if (mapRadius) return mapRadius;
mapRadius = (getMapWidth() - 1) / 2;
return mapRadius;
};

let tribeId;
let getTribeId = () => {
if (tribeId) return tribeId;
let tribeContainer = document.querySelector(
".playerName > a:nth-child(1) > i"
);
tribeId = tribeContainer.className.replace(/[^\d]/g, "");
tribeId = parseInt(tribeId);
return tribeId;
};

let baseUrl;
const getBaseUrl = () => {
if (baseUrl) return baseUrl;
baseUrl = window.location.href.match(/^.*\/\/.+\/+?/)[0];
return baseUrl;
};

const onTestButtonClick = evt => {
/*
let getUrl = getBaseUrl() + "build.php?id=37&newdid=646"
getRequest(getUrl)
.then(responseText => {
let queueTime = parseTroopQueue(responseText, 5);
debugPrint("Stable queue finishes in " + queueTime + " seconds.");
})
.catch((error) => {
if (error){
debugPrint(error);
}
})

*/

if (mainLoopTimeout) clearTimeout(mainLoopTimeout);
mainLoop();
};

// END OF BOT MAIN FUNCTIONALITY
// --------------------------------------------------------------

// --------------------------------------------------------------
// WINDOW MOUSE DRAGGING FUNCTIONALITY

let lastDragX;
let lastDragY;
let dragTarget;

const dragStart = (evt, windowDiv) => {
dragTarget = windowDiv;
lastDragX = evt.clientX;
lastDragY = evt.clientY;
document.addEventListener("mouseup", dragStop, true);
document.addEventListener("mousemove", dragMove, true);
};

const dragStop = evt => {
document.removeEventListener("mouseup", dragStop, true);
document.removeEventListener("mousemove", dragMove, true);
storeWindowPositions();
};

const dragMove = evt => {
let dx = evt.clientX - lastDragX;
let dy = evt.clientY - lastDragY;
let curPosX = parseInt(dragTarget.style.left);
let curPosY = parseInt(dragTarget.style.top);
dragTarget.style.left = curPosX + dx + "px";
dragTarget.style.top = curPosY + dy + "px";
lastDragX = evt.clientX;
lastDragY = evt.clientY;
};

// END OF WINDOW MOUSE DRAGGING FUNCTIONALITY
// --------------------------------------------------------------

// --------------------------------------------------------------
// BOT UI ELEMENTS

const storeWindowPositions = () => {
if (debugConsole) {
storeVariable("CONSOLE_X", parseInt(debugConsole.mainDiv.style.left));
storeVariable("CONSOLE_Y", parseInt(debugConsole.mainDiv.style.top));
}
if (buildingQueue) {
storeVariable(
"BUILDINGQUEUE_X",
parseInt(buildingQueue.mainDiv.style.left)
);
storeVariable("BUILDINGQUEUE_Y", parseInt(buildingQueue.mainDiv.style.top));
}
if (farmListUI) {
storeVariable("FARMLIST_X", parseInt(farmListUI.mainDiv.style.left));
storeVariable("FARMLIST_Y", parseInt(farmListUI.mainDiv.style.top));
}
if (raidListUI) {
storeVariable("RAIDLIST_X", parseInt(raidListUI.mainDiv.style.left));
storeVariable("RAIDLIST_Y", parseInt(raidListUI.mainDiv.style.top));
}
};

const spawnWindow = (title, xPos = 200, yPos = 200) => {
let newWindow = document.createElement("div");
newWindow.className = title.replace(/\s/g, "").toLowerCase();
newWindow.id = title.replace(/\s/g, "").toLowerCase();
newWindow.style.minWidth = "300px";
newWindow.style.minHeight = "100px";
newWindow.style.maxWidth = "500px";
newWindow.style.maxHeight = "300px";
newWindow.style.backgroundColor = "white";
newWindow.style.zIndex = 500;
newWindow.style.opacity = 0.9;
newWindow.style.position = "absolute";
newWindow.style.left = xPos + "px";
newWindow.style.top = yPos + "px";
newWindow.style.border = "2px solid black";
newWindow.style.borderRadius = "5px";
newWindow.style.wordWrap = "break-word";

let headerDiv = document.createElement("div");
headerDiv.addEventListener(
"mousedown",
evt => {
dragStart(evt, newWindow);
},
true
);
//headerDiv.style.pointerEvents = "none";
newWindow.appendChild(headerDiv);

// Add title
let titlePara = document.createElement("p");
titlePara.className = "titleparagraph";
titlePara.style.color = "black";
titlePara.style.padding = "3px 3px";
titlePara.style.margin = "0";
titlePara.textContent = title;
titlePara.style.textAlign = "center";
titlePara.style.fontWeight = "bold";
titlePara.minHeight = "8px";
headerDiv.appendChild(titlePara);

let hr = document.createElement("hr");
hr.style.height = "1px";
hr.style.border = "none";
hr.style.color = "black";
hr.style.backgroundColor = "black";
hr.style.margin = "3px 0px";
hr.style.padding = "0px 0px";
newWindow.appendChild(hr);

let contentDiv = document.createElement("div");
contentDiv.style.overflowY = "scroll";
contentDiv.style.overflowX = "hidden";
contentDiv.style.margin = "7px";
contentDiv.style.padding = "1px";
contentDiv.style.maxHeight = "225px";
newWindow.appendChild(contentDiv);

document.body.appendChild(newWindow);

return {
title: title,
mainDiv: newWindow,
headerDiv: headerDiv,
contentDiv: contentDiv,
delete: function() {
if (this.mainDiv.parentNode) {
try {
this.mainDiv.parentNode.removeChild(this.mainDiv);
} catch (error) {
debugPrint("Error deleting window: " + error);
}
}
}
};
};

let debugConsole;
let spawnConsole = () => {
let x = getStoredVariable("CONSOLE_X") || 100;
let y = getStoredVariable("CONSOLE_Y") || 100;
let dbconsole = spawnWindow("Debug Console", x, y);
debugConsole = dbconsole;

//-- testbutton
let button = document.createElement("button");
button.style.display = "block";
button.style.minWidth = "75px";
button.style.minHeight = "25px";
button.style.color = "black";
button.style.backgroundColor = "green";
button.style.opacity = 0.8;
button.style.margin = "5px auto";
button.style.padding = "5px";
button.style.border = "2px solid black";
button.textContent = "TEST BUTTON";
button.zIndex = 501;
button.addEventListener("click", onTestButtonClick, true);
dbconsole.headerDiv.appendChild(button);
};

let buildingQueue;
const spawnBuildingQueue = () => {
if (buildingQueue) {
buildingQueue.delete();
}
let posX = getStoredVariable("BUILDINGQUEUE_X") || 100;
let posY = getStoredVariable("BUILDINGQUEUE_Y") || 100;
buildingQueue = spawnWindow("Building Queue", posX, posY);
buildingQueue.mainDiv.style.minWidth = "200px";

let addButton = document.createElement("button");
addButton.style.display = "block";
addButton.style.minWidth = "50px";
addButton.style.minHeight = "25px";
addButton.style.color = "black";
addButton.style.backgroundColor = "green";
addButton.style.opacity = 1;
addButton.style.margin = "5px auto";
addButton.style.border = "2px solid black";
addButton.style.textAlign = "center";
addButton.textContent = "Add";
addButton.zIndex = 601;
addButton.style.display = "block";
addButton.addEventListener(
"click",
evt => {
spawnBuildingQueueAdder();
},
true
);
buildingQueue.headerDiv.appendChild(addButton);

let ul = document.createElement("ul");
ul.style.padding = "0px";
ul.style.margin = "3px";
ul.style.listStyle = "none";
ul.style.width = "100%";

let villageQueue = getBuildingQueue();
villageQueue = villageQueue.filter(
bld => bld.villageId === getActiveVillageId(document)
);

for (let i = 0; i < villageQueue.length; i++) {
let tr = document.createElement("tr");
let iterBld = villageQueue[i];
let slot = iterBld.slotId;
let id = iterBld.buildingId;
let name = buildingNames[id] || "Upgrade";
if (parseInt(slot) <= 18) {
name = "Resfield";
}
let td = document.createElement("td");
td.textContent = name;
td.style.textAlign = "center;";
td.style.padding = "2px 12px";
tr.appendChild(td);

td = document.createElement("td");
td.textContent = "Slot: " + slot;
td.style.textAlign = "center;";
td.style.padding = "2px 12px";
tr.appendChild(td);

td = document.createElement("td");
td.style.textAlign = "center;";
td.style.padding = "2px 12px";
let delButton = document.createElement("button");
delButton.style.width = "10px";
delButton.style.height = "10px";
delButton.style.color = "red";
delButton.style.backgroundColor = "white";
delButton.style.fontWeight = "bold";
delButton.textContent = "X";
delButton.addEventListener(
"click",
() => {
removeQueuedBuilding(iterBld.identifier);
},
true
);
td.appendChild(delButton);
tr.appendChild(td);

ul.appendChild(tr);
}

buildingQueue.contentDiv.appendChild(ul);
};

let buildingQueueAdder;
const spawnBuildingQueueAdder = () => {
if (buildingQueueAdder) {
buildingQueueAdder.delete();
}

let posX = 200;
let posY = 200;
if (buildingQueue) {
posX = parseInt(buildingQueue.mainDiv.style.left);
posY = parseInt(buildingQueue.mainDiv.style.top);
}
buildingQueueAdder = spawnWindow("Add to building queue", posX, posY);
buildingQueueAdder.mainDiv.style.minWidth = "630px";

let closeButton = document.createElement("button");
closeButton.style.display = "block";
closeButton.style.minWidth = "50px";
closeButton.style.minHeight = "25px";
closeButton.style.color = "black";
closeButton.style.backgroundColor = "red";
closeButton.style.opacity = 1;
closeButton.style.margin = "5px auto";
closeButton.style.border = "2px solid black";
closeButton.style.textAlign = "center";
closeButton.textContent = "Close";
closeButton.zIndex = 601;
closeButton.style.display = "block";
closeButton.addEventListener(
"click",
evt => {
buildingQueueAdder.delete();
},
true
);
buildingQueueAdder.headerDiv.appendChild(closeButton);

let dropDownMenu = document.createElement("select");
for (let key in buildingNames) {
let option = document.createElement("option");
option.value = key;
option.textContent = buildingNames[key];
dropDownMenu.appendChild(option);
}
dropDownMenu.style.display = "inline-block";
buildingQueueAdder.contentDiv.appendChild(dropDownMenu);

let input = document.createElement("input");
input.style.display = "inline-block";
input.style.minWidth = "30px";
input.style.minHeight = "20px";
input.style.color = "black";
input.style.backgroundColor = "white";
input.style.opacity = 1;
input.style.margin = "5px 5px";
input.style.padding = "1px";
input.style.border = "1px solid black";
input.zIndex = 601;
input.style.display = "inline-block";
input.value = "Building Slot ID";
buildingQueueAdder.contentDiv.appendChild(input);

let button = document.createElement("button");
button.style.display = "block";
button.style.minWidth = "75px";
button.style.minHeight = "25px";
button.style.color = "black";
button.style.backgroundColor = "green";
button.style.opacity = 1;
button.style.margin = "5px 5px";
button.style.padding = "5px";
button.style.border = "2px solid black";
button.textContent = "Add new building";
button.zIndex = 601;
button.style.display = "inline-block";
button.addEventListener(
"click",
evt => {
let buildingId = dropDownMenu.options[dropDownMenu.selectedIndex].value;
let buildingCost = newBuildingCosts[buildingId];
let slotId = input.value.replace(/[^\d]/g, "");
if (slotId) {
slotId = parseInt(slotId);
} else {
return;
}
buildingId = parseInt(buildingId);
let villageId = getActiveVillageId(document);
queueBuilding(villageId, slotId, buildingId, buildingCost, 0);
spawnBuildingQueue();
input.value = "";
},
true
);

buildingQueueAdder.contentDiv.appendChild(button);

let button2 = document.createElement("button");
button2.style.display = "block";
button2.style.minWidth = "75px";
button2.style.minHeight = "25px";
button2.style.color = "black";
button2.style.backgroundColor = "green";
button2.style.opacity = 1;
button2.style.margin = "5px 5px";
button2.style.padding = "5px";
button2.style.border = "2px solid black";
button2.textContent = "Upgrade building in slot";
button2.zIndex = 601;
button2.style.display = "inline-block";
button2.addEventListener(
"click",
evt => {
let buildingId = -1;
let buildingCost = [-1, -1, -1, -1, -1];
let slotId = input.value.replace(/[^\d]/g, "");
let isUpgrade = 1;
if (slotId) {
slotId = parseInt(slotId);
} else {
return;
}
let villageId = getActiveVillageId(document);
queueBuilding(villageId, slotId, buildingId, buildingCost, isUpgrade);
spawnBuildingQueue();
input.value = "";
},
true
);
buildingQueueAdder.contentDiv.appendChild(button2);
};

let farmListUI;
const spawnFarmList = () => {
if (farmListUI) {
farmListUI.delete();
}

let farmList = getFarmList();
let active = getActiveVillageId(document);
farmList = farmList.filter(farm => farm.fromVillage === active);
let villaList = getVillageList(document);
let villageObject = villaList.find(v => v.id === active);
farmList.sort((a, b) => {
aCoords = coordZToXY(a.targetZ);
bCoords = coordZToXY(b.targetZ);
aDistSq = squaredDistance(
aCoords.x,
aCoords.y,
villageObject.x,
villageObject.y
);
bDistSq = squaredDistance(
bCoords.x,
bCoords.y,
villageObject.x,
villageObject.y
);
return aDistSq - bDistSq;
});

let posX = getStoredVariable("FARMLIST_X") || 300;
let posY = getStoredVariable("FARMLIST_Y") || 400;
farmListUI = spawnWindow("Farm list", posX, posY);
farmListUI.mainDiv.maxWidth = "600px";

let ul = document.createElement("ul");
ul.style.padding = "0px";
ul.style.margin = "3px";
ul.style.listStyle = "none";
ul.style.width = "100%";

let headerTr = document.createElement("tr");
let th1 = document.createElement("th");
th1.textContent = "Target";
th1.style.textAlign = "center";
th1.style.padding = "2px 10px";
headerTr.appendChild(th1);
th1 = document.createElement("th");
th1.textContent = "Interval";
th1.style.textAlign = "center";
th1.style.padding = "2px 10px";
headerTr.appendChild(th1);
th1 = document.createElement("th");
th1.textContent = "Randomness";
th1.style.textAlign = "center";
th1.style.padding = "2px 10px";
headerTr.appendChild(th1);
th1 = document.createElement("th");
th1.textContent = "Troops";
th1.style.textAlign = "center";
th1.style.padding = "2px 10px";
headerTr.appendChild(th1);
ul.appendChild(headerTr);

for (let i = 0; i < farmList.length; i++) {
let tr = document.createElement("tr");
let iterFarm = farmList[i];
if (iterFarm.hasThreat) tr.style.backgroundColor = "yellow";
if (iterFarm.isPaused) tr.style.backgroundColor = "red";
let targetZ = iterFarm.targetZ;
let targetName = iterFarm.targetName;
let intervalSecs = iterFarm.interval / 1000;
let randomnessSecs = iterFarm.randomness / 1000;
let troopString = iterFarm.troopArray.join(" ");
let coords = coordZToXY(iterFarm.targetZ);
let td = document.createElement("td");
td.innerHTML =
"<a href=position_details.php?x=" +
coords.x +
"&y=" +
coords.y +
">" +
targetName +
"</a>";
td.style.textAlign = "center";
td.style.padding = "2px 10px";
tr.appendChild(td);
td = document.createElement("td");
td.textContent = intervalSecs;
td.style.textAlign = "center";
td.style.padding = "2px 10px";
tr.appendChild(td);
td = document.createElement("td");
td.textContent = randomnessSecs;
td.style.textAlign = "center";
td.style.padding = "2px 10px";
tr.appendChild(td);
td = document.createElement("td");
td.textContent = troopString;
td.style.textAlign = "center";
td.style.padding = "2px 10px";
tr.appendChild(td);

td = document.createElement("td");
td.style.textAlign = "center";
td.style.padding = "2px 10px";
let delButton = document.createElement("button");
delButton.style.width = "10px";
delButton.style.height = "10px";
delButton.style.color = "red";
delButton.style.backgroundColor = "white";
delButton.style.fontWeight = "bold";
delButton.textContent = "X";
delButton.addEventListener(
"click",
() => {
deleteFarmlistEntry(iterFarm.fromVillage, iterFarm.targetZ);
spawnFarmList();
},
true
);
td.appendChild(delButton);
tr.appendChild(td);

ul.appendChild(tr);
}

farmListUI.contentDiv.appendChild(ul);
};

const spawnTroopTaskButtons = () => {
let trainunits = document.querySelector(".buildActionOverview.trainUnits");
if (!trainunits) return;
let container = document.querySelector("#build > form");
if (!container) return;

let currentVillage = getActiveVillageId(document);
let currentSlot = parseInt(window.location.href.match(/id=(\d+)/)[1]);

if (!document.querySelector(".trainerDiv")) {
let trainerDiv = document.createElement("div");
trainerDiv.className = "trainerDiv";

let titleText = document.createElement("p");
titleText.innerText = "Auto troop trainer";
titleText.style.fontWeight = "bold";
trainerDiv.appendChild(titleText);

let intervalText = document.createElement("p");
intervalText.innerText = "Check every X seconds";
trainerDiv.appendChild(intervalText);

let intervalInput = document.createElement("input");
intervalInput.value = "3600";
trainerDiv.appendChild(intervalInput);

let minDurationText = document.createElement("p");
minDurationText.innerText =
"If troop queue duration is less than X seconds";
trainerDiv.appendChild(minDurationText);

let minDurationInput = document.createElement("input");
minDurationInput.value = "3600";
trainerDiv.appendChild(minDurationInput);

let troopAmountText = document.createElement("p");
troopAmountText.innerText = "Then train X troops";
trainerDiv.appendChild(troopAmountText);

let troopAmountInput = document.createElement("input");
troopAmountInput.value = "5";
trainerDiv.appendChild(troopAmountInput);

let troopTierText = document.createElement("p");
troopTierText.innerText =
"The troop tier to train (for example, Equites Imperatoris = 5)";
trainerDiv.appendChild(troopTierText);

let troopTierInput = document.createElement("input");
trainerDiv.appendChild(troopTierInput);

let addButton = document.createElement("button");
addButton.style.display = "block";
addButton.style.minWidth = "50px";
addButton.style.minHeight = "25px";
addButton.style.color = "black";
addButton.style.backgroundColor = "#FF9633";
addButton.style.opacity = 1;
addButton.style.margin = "5px 5px";
addButton.style.border = "2px solid black";
addButton.style.textAlign = "center";
addButton.textContent = "Save troop task";
addButton.zIndex = 401;
addButton.style.display = "block";
addButton.addEventListener(
"click",
event => {
addTroopTask(
parseInt(intervalInput.value) * 1000,
parseInt(minDurationInput.value),
parseInt(troopAmountInput.value),
currentVillage,
currentSlot,
parseInt(troopTierInput.value)
);
spawnTroopTaskButtons();
event.preventDefault();
},
true
);
trainerDiv.appendChild(addButton);

let delButton = document.createElement("button");
delButton.style.display = "block";
delButton.style.minWidth = "50px";
delButton.style.minHeight = "25px";
delButton.style.color = "black";
delButton.style.backgroundColor = "#FF9633";
delButton.style.opacity = 1;
delButton.style.margin = "5px 5px";
delButton.style.border = "2px solid black";
delButton.style.textAlign = "center";
delButton.textContent = "Remove troop task";
delButton.zIndex = 401;
delButton.style.display = "block";
delButton.addEventListener(
"click",
() => {
deleteTroopTask(currentVillage, currentSlot);
spawnTroopTaskButtons();
},
true
);
trainerDiv.appendChild(delButton);

container.parentNode.insertBefore(trainerDiv, container);
}

let previous = document.querySelector(".taskDiv");
if (previous) {
previous.parentNode.removeChild(previous);
}

let troopTasks = getTroopTasks();
let currentTask = troopTasks.find(
task =>
task.buildingSlot === currentSlot && task.villageId === currentVillage
);

if (!currentTask) return;
let taskDiv = document.createElement("div");
taskDiv.className = "taskDiv";

let ul = document.createElement("ul");
let tr = document.createElement("tr");
let td = document.createElement("td");
td.textContent = "Interval";
td.style.padding = "5px";
td.style.fontWeight = "bold";
tr.appendChild(td);

td = document.createElement("td");
td.textContent = "Min. queue length";
td.style.padding = "5px";
td.style.fontWeight = "bold";
tr.appendChild(td);

td = document.createElement("td");
td.textContent = "Amount to train";
td.style.padding = "5px";
td.style.fontWeight = "bold";
tr.appendChild(td);

td = document.createElement("td");
td.textContent = "Troop tier";
td.style.padding = "5px";
td.style.fontWeight = "bold";
tr.appendChild(td);
ul.appendChild(tr);

tr = document.createElement("tr");
td = document.createElement("td");
td.textContent = currentTask.interval / 1000;
td.style.padding = "5px";
tr.appendChild(td);

td = document.createElement("td");
td.textContent = currentTask.minimumTime;
td.style.padding = "5px";
tr.appendChild(td);

td = document.createElement("td");
td.textContent = currentTask.troopsToTrain;
td.style.padding = "5px";
tr.appendChild(td);

td = document.createElement("td");
td.textContent = currentTask.troopTier;
td.style.padding = "5px";
tr.appendChild(td);
ul.appendChild(tr);

taskDiv.appendChild(ul);
container.parentNode.insertBefore(taskDiv, container);
};

const spawnRaidListButtons = () => {
let container = document.querySelector("#raidList");
let raidListButtonsDiv = document.createElement("div");
raidListButtonsDiv.style.width = "200px";
raidListButtonsDiv.style.display = "block";

let dropDownMenu = document.createElement("select");
let raidLists = document.querySelectorAll("#raidList > .listEntry");
for (let i = 0; i < raidLists.length; i++) {
let iterList = raidLists[i];
let id = iterList.id;
let titleDiv = iterList.querySelector("form > .listTitle > .listTitleText");
let name = titleDiv.textContent.trim();
let option = document.createElement("option");
option.value = id;
option.textContent = name;
dropDownMenu.appendChild(option);
}
raidListButtonsDiv.appendChild(dropDownMenu);

let addButton = document.createElement("button");
addButton.style.display = "block";
addButton.style.minWidth = "50px";
addButton.style.minHeight = "25px";
addButton.style.color = "black";
addButton.style.backgroundColor = "#FF9633";
addButton.style.opacity = 1;
addButton.style.margin = "5px 5px";
addButton.style.border = "2px solid black";
addButton.style.textAlign = "center";
addButton.textContent = "Add to raidlists";
addButton.zIndex = 401;
addButton.style.display = "inline-block";
addButton.addEventListener(
"click",
() => {
let name = dropDownMenu.options[dropDownMenu.selectedIndex].textContent;
let id = dropDownMenu.options[dropDownMenu.selectedIndex].value;
addRaidListEntry(id, name);
spawnRaidListUI();
debugPrint("Added raid list " + name + " id: " + id);
},
true
);
raidListButtonsDiv.appendChild(addButton);

let intervalPara = document.createElement("p");
intervalPara.textContent = "Raidlist send interval";
let intervalInput = document.createElement("input");
raidListButtonsDiv.appendChild(intervalPara);
raidListButtonsDiv.appendChild(intervalInput);

let randomnessPara = document.createElement("p");
randomnessPara.textContent = "Raidlist interval randomness";
let randomnessInput = document.createElement("input");
raidListButtonsDiv.appendChild(randomnessPara);
raidListButtonsDiv.appendChild(randomnessInput);

let checkBoxPara = document.createElement("p");
checkBoxPara.textContent = "Enable raid list sender";
let checkBox = document.createElement("input");
checkBox.type = "checkbox";
checkBox.value = "enabled";
checkBox.name = "enableRaidListSender";
checkBox.style.display = "block";
checkBox.style.marginLeft = "50px";
checkBox.style.width = "25px";
checkBox.style.height = "25px";
raidListButtonsDiv.appendChild(checkBoxPara);
raidListButtonsDiv.appendChild(checkBox);

let saveButton = document.createElement("button");
saveButton.style.display = "block";
saveButton.style.minWidth = "50px";
saveButton.style.minHeight = "25px";
saveButton.style.color = "black";
saveButton.style.backgroundColor = "#FF9633";
saveButton.style.opacity = 1;
saveButton.style.margin = "5px 15px";
saveButton.style.border = "2px solid black";
saveButton.style.textAlign = "center";
saveButton.textContent = "Save configuration";
saveButton.zIndex = 401;
saveButton.style.display = "block";
saveButton.addEventListener(
"click",
() => {
spawnRaidListUI();
let interval = parseInt(intervalInput.value) * 1000;
let randomness = parseInt(randomnessInput.value) * 1000;
let enabled = checkBox.checked ? 1 : 0;
if (!interval || !randomness) return;
let newRaidListTimes = {
enabled: enabled,
interval: interval,
randomness: randomness,
lastSent: null,
nextRandomWait: Math.round(randFloat(-randomness, randomness))
};
saveRaidListTimeData(newRaidListTimes);
debugPrint("Saved raid list config");
},
true
);
raidListButtonsDiv.appendChild(saveButton);
raidListButtonsDiv.appendChild(document.createElement("hr"));

let raidListTimeData = getRaidListTimeData();
if (!raidListTimeData) {
intervalInput.value = 3600;
randomnessInput.value = 600;
checkBox.checked = false;
} else {
intervalInput.value = raidListTimeData.interval / 1000;
randomnessInput.value = raidListTimeData.randomness / 1000;
checkBox.checked = raidListTimeData.enabled ? true : false;
}

container.insertBefore(raidListButtonsDiv, container.children[0]);
};

let raidListUI;
const spawnRaidListUI = () => {
if (raidListUI) {
raidListUI.delete();
}

let posX = getStoredVariable("RAIDLIST_X") || 300;
let posY = getStoredVariable("RAIDLIST_Y") || 400;
raidListUI = spawnWindow("Raid lists to send", posX, posY);
raidListUI.mainDiv.maxWidth = "600px";

let ul = document.createElement("ul");
ul.style.padding = "0px";
ul.style.margin = "3px";
ul.style.listStyle = "none";
ul.style.width = "100%";
let raidLists = getRaidListEntries();
for (let i = 0; i < raidLists.length; i++) {
let iterList = raidLists[i];
let tr = document.createElement("tr");
let td = document.createElement("td");
td.style.textAlign = "center";
td.style.padding = "2px 10px";
td.textContent = iterList.listName;
tr.appendChild(td);
td = document.createElement("td");
td.style.textAlign = "center";
td.style.padding = "2px 10px";
let delButton = document.createElement("button");
delButton.style.width = "10px";
delButton.style.height = "10px";
delButton.style.color = "red";
delButton.style.backgroundColor = "white";
delButton.style.fontWeight = "bold";
delButton.textContent = "X";
delButton.addEventListener(
"click",
() => {
deleteRaidListEntry(iterList.listId);
spawnRaidListUI();
debugPrint("Deleted raidlist entry " + iterList.listName);
},
true
);
td.appendChild(delButton);
tr.appendChild(td);

ul.appendChild(tr);
}

raidListUI.contentDiv.appendChild(ul);
};

const parseRaidLists = () => {
if (window.location.href.toLowerCase().includes("tt=99")) {
let raidLists = document.querySelectorAll("#raidList > .listEntry");
for (let i = 0; i < raidLists.length; i++) {
let iterList = raidLists[i];
let titleDiv = iterList.querySelector(
"form > .listTitle > .listTitleText"
);
if (titleDiv) {
let name = titleDiv.textContent.trim();
debugPrint("Parsed raidlist: " + name);
}
let rows = iterList.querySelectorAll(
"form > .listContent > .detail > .list > tbody > tr"
);
debugPrint("Rows: " + rows.length);
for (let r = 0; r < rows.length; r++) {
let iterRow = rows[r];
let checkBox = iterRow.getElementsByClassName("checkbox")[0];
let checkBoxName = checkBox
.getElementsByTagName("input")[0]
.getAttribute("name");
let hasThreat = /iReport2|iReport3/.test(
iterRow.getElementsByClassName("lastRaid")[0].innerHTML
);
debugPrint(
"Row name: " + checkBoxName + " threat: " + (hasThreat ? "Yes" : "No")
);
}
}
}
};

const createPositionDetailsLink = () => {
if (window.location.href.toLowerCase().includes("karte")) {
let link = document.querySelector(
"#tileDetails > .detailImage > .options > .option > a"
);
if (link) {
let href = link.getAttribute("href").toLowerCase();
let xMatch = href.match(/x=(-?\d+)/);
let yMatch = href.match(/y=(-?\d+)/);
if (xMatch && yMatch) {
let x = parseInt(xMatch[1]);
let y = parseInt(yMatch[1]);
let posDetailsHref = "position_details.php?x=" + x + "&y=" + y;
let header = document.querySelector("#tileDetails > h1");
if (
header &&
!header.innerHTML
.toString()
.toLowerCase()
.includes("href")
) {
let newLink =
"<a href=" + posDetailsHref + ">" + header.innerHTML + "</a>";
header.innerHTML = newLink;
}
}
}
setTimeout(createPositionDetailsLink, 2500);
}
};

const replacePlusHotLinks = () => {
let activeVillage = getActiveVillageId(document);
let links = getStoredBuildingLinks();
if (links) {
let currentVillageLinks = links[activeVillage];
if (currentVillageLinks) {
let barracksButton = document.querySelector(
".layoutButton.barracksBlack.gold"
);
if (barracksButton && currentVillageLinks.barracks) {
let clonedButton = barracksButton.cloneNode(true);
clonedButton.addEventListener("click", () => {
unsafeWindow.location.href = currentVillageLinks.barracks;
});
clonedButton.className = clonedButton.className
.replace(/gold/, "green")
.replace(/disabled/, "");
barracksButton.parentNode.replaceChild(clonedButton, barracksButton);
}

let stableButton = document.querySelector(
".layoutButton.stableBlack.gold"
);
if (stableButton && currentVillageLinks.stable) {
let clonedButton = stableButton.cloneNode(true);
clonedButton.addEventListener("click", () => {
unsafeWindow.location.href = currentVillageLinks.stable;
});
clonedButton.className = clonedButton.className
.replace(/gold/, "green")
.replace(/disabled/, "");
stableButton.parentNode.replaceChild(clonedButton, stableButton);
}

let marketButton = document.querySelector(
".layoutButton.marketBlack.gold"
);
if (marketButton && currentVillageLinks.marketplace) {
let clonedButton = marketButton.cloneNode(true);
clonedButton.addEventListener("click", () => {
unsafeWindow.location.href = currentVillageLinks.marketplace;
});
clonedButton.className = clonedButton.className
.replace(/gold/, "green")
.replace(/disabled/, "");
marketButton.parentNode.replaceChild(clonedButton, marketButton);
}

let workshopButton = document.querySelector(
".layoutButton.workshopBlack.gold"
);
if (workshopButton && currentVillageLinks.workshop) {
let clonedButton = workshopButton.cloneNode(true);
clonedButton.addEventListener("click", () => {
unsafeWindow.location.href = currentVillageLinks.workshop;
});
clonedButton.className = clonedButton.className
.replace(/gold/, "green")
.replace(/disabled/, "");
workshopButton.parentNode.replaceChild(clonedButton, workshopButton);
}
}
}
};

const parseTroopQueue = (responseText, troopTier) => {
let respDocument = document.createElement("div");
respDocument.innerHTML = responseText;

let times = respDocument.querySelectorAll(
".under_progress > tbody > tr > td.dur > .timer"
);
if (!times || times.length === 0) return 0;

let lastFinished = times[times.length - 1];
let queueTime = parseInt(lastFinished.getAttribute("value"));

let maxAmountLink = respDocument.querySelector(
".innerTroopWrapper.troop" + troopTier + " > .details > .cta > a"
);
if (maxAmountLink) {
let maxAmount = parseInt(maxAmountLink.textContent);
debugPrint("Max troops we can train is " + maxAmount);
}
return queueTime;
};

const addFarmListButtons = () => {
let container = document.querySelector("#tileDetails > div.detailImage");

let intervalPara = document.createElement("p");
intervalPara.textContent = "Interval to send at (seconds)";
intervalPara.style.minWidth = "30px";
intervalPara.style.minHeight = "20px";
intervalPara.style.color = "#FF9633";
intervalPara.style.margin = "2px 5px";
intervalPara.style.fontWeight = "bold";
container.appendChild(intervalPara);

let intervalInput = document.createElement("input");
intervalInput.style.display = "block";
intervalInput.style.minWidth = "30px";
intervalInput.style.minHeight = "20px";
intervalInput.style.color = "black";
intervalInput.style.backgroundColor = "#FF9633";
intervalInput.style.margin = "2px 5px";
intervalInput.style.padding = "1px";
intervalInput.style.border = "1px solid black";
intervalInput.zIndex = 401;
intervalInput.value = 3600;
container.appendChild(intervalInput);

let randomnessPara = document.createElement("p");
randomnessPara.textContent = "Interval randomness (seconds)";
randomnessPara.style.minWidth = "30px";
randomnessPara.style.minHeight = "20px";
randomnessPara.style.color = "#FF9633";
randomnessPara.style.margin = "2px 5px";
randomnessPara.style.fontWeight = "bold";
container.appendChild(randomnessPara);

let randomnessInput = document.createElement("input");
randomnessInput.style.display = "block";
randomnessInput.style.minWidth = "30px";
randomnessInput.style.minHeight = "20px";
randomnessInput.style.color = "black";
randomnessInput.style.backgroundColor = "#FF9633";
randomnessInput.style.margin = "2px 5px";
randomnessInput.style.padding = "1px";
randomnessInput.style.border = "1px solid black";
randomnessInput.zIndex = 401;
randomnessInput.value = 300;
container.appendChild(randomnessInput);

let troopsPara = document.createElement("p");
troopsPara.textContent = "Troops to send";
troopsPara.style.minWidth = "30px";
troopsPara.style.minHeight = "20px";
troopsPara.style.color = "#FF9633";
troopsPara.style.margin = "2px 5px";
troopsPara.style.fontWeight = "bold";
container.appendChild(troopsPara);

let troopsInput = document.createElement("input");
troopsInput.style.display = "block";
troopsInput.style.minWidth = "30px";
troopsInput.style.minHeight = "20px";
troopsInput.style.color = "black";
troopsInput.style.backgroundColor = "#FF9633";
troopsInput.style.margin = "2px 5px";
troopsInput.style.padding = "1px";
troopsInput.style.border = "1px solid black";
troopsInput.zIndex = 401;
troopsInput.value = "2 0 0 0 0 0 0 0 0 0 0";
container.appendChild(troopsInput);

let addButton = document.createElement("button");
addButton.style.display = "block";
addButton.style.minWidth = "50px";
addButton.style.minHeight = "25px";
addButton.style.color = "black";
addButton.style.backgroundColor = "#FF9633";
addButton.style.opacity = 1;
addButton.style.margin = "5px 5px";
addButton.style.border = "2px solid black";
addButton.style.textAlign = "center";
addButton.textContent = "Add to farmlist";
addButton.zIndex = 401;
addButton.style.display = "block";
addButton.addEventListener(
"click",
() => {
let active = getActiveVillageId(document);
let targetX = parseInt(document.location.href.match(/x=(-?\d+)/)[1]);
let targetY = parseInt(document.location.href.match(/y=(-?\d+)/)[1]);
let targetZ = coordsXYToZ(targetX, targetY);
let name = document
.querySelector("#content > h1")
.innerHTML.match(/(.*?)<span/)[1]
.replace(/[^\dA-Za-z\s123456789 \.]/g, "")
.trim();
let interval = parseInt(intervalInput.value);
let randomness = parseInt(randomnessInput.value);
let troopsArray = troopsInput.value
.trim()
.replace(/\s\s+/g, " ")
.split(" ");
troopsArray = troopsArray.map(tr => parseInt(tr));
if (troopsArray.length != 11) return;
addFarmListEntry(
active,
targetZ,
name,
troopsArray,
interval * 1000,
randomness * 1000
);
spawnFarmList();
},
true
);

container.appendChild(addButton);
};

const debugPrint = msg => {
let date = new Date();
let timeString =
(date.getHours() < 10 ? "0" : "") +
date.getHours() +
":" +
(date.getMinutes() < 10 ? "0" : "") +
date.getMinutes() +
"." +
(date.getSeconds() < 10 ? "0" : "") +
date.getSeconds();
let message = timeString + " | " + msg;
console.log(message);
if (!debugConsole) return;
let para = document.createElement("p");
para.className = "debugparagraph";
para.style.color = "black";
para.style.padding = "2px 2px";
para.style.margin = "0px";
para.style.textAlign = "left";
para.style.pointerEvents = "none";
para.minHeight = "8px";
para.innerHTML = message;

debugConsole.contentDiv.appendChild(para);
debugConsole.contentDiv.scrollTop = para.offsetTop;
};

const startCrawledTimer = timerNode => {
let offset =
Math.floor(Date.now() / 1000) -
unsafeWindow.Travian.TimersAndCounters.startedAt;
let originalValue = parseInt(timerNode.getAttribute("value"));
let newValue = originalValue + offset;
timerNode.setAttribute("value", newValue);
unsafeWindow.Travian.TimersAndCounters.initTimer(timerNode);
};

// END OF BOT UI ELEMENTS
// --------------------------------------------------------------

const tabId = Math.round(randFloat(0, 10000000));
let alreadyRunning = 0;
if (!alreadyRunning) {
setTimeout(() => {
initialize();
}, 200);
}