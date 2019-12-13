window.onload = function(){ 
    PreLoad()
}

var useOnlyCityBuses = true //Onlys gets the routes and buspositions of buses 1-12
var preLoadFinished = false
var routeAndStopsLayers = []; //For drawing onto the map
var busMarkersLayer;
var busData = [];
var RTBusData = [];


var ip = location.host;


var rtURL = 'http://' + ip.toString() + '/API/GetRTBusData'


var api_base = 'https://api.ul.se/api/v3/line/'
var map = L.map('map').setView([59.858309, 17.646165], 12);
L.control.scale().addTo(map);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {attribution: 'OSM'}).addTo(map);

var stopMarkerStyle = {
    radius: 5,
    fillColor: "#1d4afc",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 1
};

var busMarkerStyle = {
    radius: 4,
    fillColor: "#f1c800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 1
};


/**
  * @desc Loads the busdata, and then activates and updates some UI elements
*/
function PreLoad(){
    console.log("Began pre load")
    var url = 'https://api.ul.se/api/v3/lines/' 
    var requests = [];
    $.getJSON(url, function(data ) { 
        console.log("Got line numbers")

        for(var i = 0; i < data.length; i++) {
            var lineNo = data[i].lineNo;
            if(useOnlyCityBuses && (lineNo > 12)){break}
            requests[i] = $.getJSON('https://api.ul.se/api/v3/line/' + lineNo.toString())
        }

        $.when.apply(undefined, requests).then( function() {
            var select = document.getElementById('busSelect')
            
            var opt = document.createElement('option');
            opt.value = 0
            opt.innerText = "-"
            select.appendChild(opt);

            for(var i = 0; i < requests.length; i++){

                //Store the routedata locally and globally
                var data = requests[i].responseJSON
                busData[i] = data

                //Update the UI list on the web page
                var opt = document.createElement('option');
                opt.value = data.lineNo
                opt.innerText = data.lineNo + ": " +  data.description
                select.appendChild(opt);

                //Create map layers and store globally for later drawing onto the map
                var routeCoords = [];
                var stopsMarkers = [];

                //Store the route coords locally
                for (var j = 0; j < data.path.length; j++) {routeCoords[j] = [data.path[j].latitude, data.path[j].longitude];}
                
                //Store leaflet markers out of the stop data
                for (var j = 0; j < data.pointsOnRoute.length; j++) {
                    stopsMarkers[j] = L.circleMarker([data.pointsOnRoute[j].coordinate.latitude, data.pointsOnRoute[j].coordinate.longitude], stopMarkerStyle)
                        .bindPopup(data.pointsOnRoute[j].name)
                }    
                
                var routePath = L.polyline(routeCoords);    //Leaflet layer for the route
                var stops = L.layerGroup(stopsMarkers)      //Leaflet layer for the bus stops
                routeAndStopsLayers[i] = [routePath,stops]; //Add them to global list so we can access them later.
            }
            preLoadFinished = true
            document.getElementById("button").disabled = false;
            document.getElementById("button").style = "button"  
            console.log("Preload finished")
        });
    })


    $.getJSON(rtURL, function(data){
        for(var i = 0; i < data.length; i++){
            RTBusData[i] = data[i]
        }
    })
}


/**
  * @desc Callback for the list selection on the wep page
*/
function ListSelectCallback(event){
    var bus_nr = this.options[this.selectedIndex].value
    if(bus_nr!=0){ GetRouteDataAndUpdateMap(bus_nr) } else { CleanMapFromRoutesAndStops() }
}


/**
  * @desc Gets the route and stop data from UL's API and plots this to maps
  * @param int $bus_nr 
*/
function GetRouteDataAndUpdateMap(bus_nr){
    var busDataIndex;

    for(var i = 0; i < busData.length; i++){
        if(busData[i].lineNo == bus_nr){
            busDataIndex = i;
        }
    }

    CleanMapFromRoutesAndStops();

    map.addLayer(routeAndStopsLayers[busDataIndex][0])
    map.addLayer(routeAndStopsLayers[busDataIndex][1])

}  

function CleanMapFromRoutesAndStops(){
    for(var i = 0; i < busData.length; i++){
        if(map.hasLayer(routeAndStopsLayers[i][0])){ map.removeLayer(routeAndStopsLayers[i][0]) }
        if(map.hasLayer(routeAndStopsLayers[i][1])){ map.removeLayer(routeAndStopsLayers[i][1]) }
    }
}


/**
  * @desc Callback for the test button on the web page
*/
function RealTimeTestButtonCallback(){
    console.log("Blip")
    RealTimePositionTrack()
}


/**
  * @desc Gets the GPS coordinates of all routes that we specify. 
  * @param either int or list of busses to get route coordinates 
  * @todo integrate trafiklabb API
*/
function RealTimePositionTrack(){

    //console.log(routeData)
    $.getJSON(rtURL, 
        function(data){
            var RTData = data
            UpdateMap(RTData)
            setTimeout(RealTimePositionTrack, 2000); 
        }
    );
}

/**
  * @desc Updates the positions for all the busses(currently only one)
  * @param vector data contains GPS coordinates(should later contain a list of coordinates for different buses)
  * @todo integrate trafiklabb API
*/
function UpdateMap(RTData){  
    if(map.hasLayer(busMarkersLayer)){ map.removeLayer(busMarkersLayer) }

    console.log("Updated RT position. Showing " + RTData.length.toString() + " busses")

    var busMarkers = [];

    console.log(RTData[1])

    //Store leaflet markers out of the bus data
    for(var i = 0; i < RTData.length; i++){
        busMarkers[i] = L.circleMarker([RTData[i][0][0] , RTData[i][0][1]], busMarkerStyle)
            .bindPopup("Bussjävel")
    }

    busMarkersLayer = L.layerGroup(busMarkers)
    map.addLayer(busMarkersLayer)

}




