




var center = ol.proj.fromLonLat([17.646165, 59.858309])
var api_base = 'https://api.ul.se/api/v3/line/'

// Style of route and busstops and  (i.e color, size, icon etc.)
var styles = {
  'route': new ol.style.Style
  ({
    stroke: new ol.style.Stroke({
    width: 3, color: [42, 59, 87, 0.8]
    })
  }),

  'busstopMarker': new ol.style.Style
  ({
    image: new ol.style.Circle({
      fill: new ol.style.Fill({color: 'white'}),
      radius: 6,
      stroke: new ol.style.Stroke({color: [42, 59, 87, 0.8], width: 3})
    })
  }), 

  'bussMarker': new ol.style.Style
  ({
    image: new ol.style.Icon({
      src: 'static/img/bussIcon.png',
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction',
      scale: 0.2
    })
  })
};

var /*route*/routeVectorLayer = new ol.layer.Vector({
  source: new ol.source.Vector,
  style: function(feature) 
  {
    return styles[feature.get('type')];
  }}
);

var busVectorLayer = new ol.layer.Vector({
  source: new ol.source.Vector,
  style: function(feature) 
  {
    return styles[feature.get('type')];
  }}
);

// Creates the map 
var map = new ol.Map({
  target: document.getElementById('map'),

  view: new ol.View({
    center: center,
    zoom: 12,
    minZoom: 2,
    maxZoom: 30
  }),

  layers: 
  [
    new ol.layer.Tile({
      source: new ol.source.OSM({})

    }),
    /*new ol.layer.Tile({
      source: new ol.source.XYZ({
        url: 'https://api.mapbox.com/styles/v1/basicinsect/ck34b3i7y4h5r1csfsx7qsd63/tiles/256/{z}/{x}/{y}?'+
        'access_token=pk.eyJ1IjoiYmFzaWNpbnNlY3QiLCJhIjoiY2szNGIyeG5sMGtvNTNtcDNzazM3NHB6MSJ9.G5Ft6aJ48hrlvJPHtogaGw'
      })
    }),
    */
    routeVectorLayer,
    busVectorLayer
  ]}
);

// Called by selecting a route in the list on the map page; draws the route to the map
function drawBusRoute(event){
  
  routeVectorLayer.getSource().clear();
  var vectorSource = routeVectorLayer.getSource();//new ol.source.Vector;

  var bus_nr = this.options[this.selectedIndex].value

  var req_url = api_base + bus_nr.toString()

  $.getJSON(req_url, function(data ) { 
    
    var routeCoords = [];
    var stopsNames = [];
    var stopsCoords = [];
    var bussStopMarkers = [];

    // Extracs the route coordinates to the correct format for plotting the route using OpenLayers

    for (var i = 0; i < data.path.length; i++) {routeCoords[i] = [data.path[i].longitude, data.path[i].latitude];}

    // Format the route coordinates into "LineString", which OpenLayers can plot on the map
    var geometry = new ol.geom.LineString(routeCoords);
    geometry.transform('EPSG:4326', 'EPSG:3857'); //Transform to your map projection

    // Extracts the bus stops of the route into the correct format for plotting them using OpenLayers AND another array of their names

    for (var i = 0; i < data.pointsOnRoute.length; i++) 
    {

      stopsNames[i] = data.pointsOnRoute[i].name; 
      stopsCoords[i] = [data.pointsOnRoute[i].coordinate.longitude, data.pointsOnRoute[i].coordinate.latitude]; 
      
      var marker = (new ol.Feature({
        type: 'busstopMarker',
        geometry: new ol.geom.Point(ol.proj.fromLonLat(stopsCoords[i])), 
        info: stopsNames[i]
      }));

      bussStopMarkers[i] = marker

    }
    

    // Create the "Feature" for the route. Features can be drawn to the map 
    var routeFeature = new ol.Feature
    ({
      type: 'route',
      geometry: geometry
    });


    for (var i = 0; i < bussStopMarkers.length; i++) 
    {
      vectorSource.addFeature(bussStopMarkers[i]);
    }

    vectorSource.addFeature(routeFeature);


    var selectClick = new ol.interaction.Select({
      multi: true
    });
    map.addInteraction(selectClick);

    selectClick.on('select', function(evt) {
      if(feature)
      {
        console.log("da")
      }
      var feature = evt.selected;
      console.info(feature[0].values_.info);
    });

    function onFeatureHighlighted (evt) {
      console.log("sss")  
    }

  });
}
  
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var v = true
var updateFrequency = 1000 //in ms: how often a new position value is fethed from the database
var bussMarker = (new ol.Feature({
  type: 'bussMarker',
  geometry: new ol.geom.Point(center), 
}));


// Called by clicking the test button on the map page
function showRealTimePositionTest(){
  if(v){
    v = false 
    getDataAndUpdateMap()
  }
  else{
    v = true
    document.getElementById('button').innerHTML = 'Testa realtidsposition'
    var vectorSource = busVectorLayer.getSource();
    vectorSource.clear();
  }
}


var url = 'https://api.ul.se/api/v3/lines/' //JSON with all lines that aren't null
var select = document.getElementById('busSelect')

$.getJSON(url, function(data ) { 
    for(var i = 0; i < data.length; i++){
        var opt = document.createElement('option');
        opt.value = data[i].lineNo
        opt.innerText = data[i].lineNo + ": " +  data[i].description
        select.appendChild(opt);
    }
})
// Continuosly calls itself and gets the latest position data for the test bus data, 
// it then updates the busmarker geometry (position). If already in motion, it stops 
// if the button is pressed.

function getDataAndUpdateMap(){

  if(v){
    return
  }

  var u = 'http://127.0.0.1:5000/API/testLatestPosData';
  
  document.getElementById('button').innerHTML = 'Stop'
  $.getJSON(u, function(data) { 

    console.log(data)

    var vectorSource = busVectorLayer.getSource();
    vectorSource.clear();
    bussMarker.setGeometry(new ol.geom.Point(ol.proj.fromLonLat(data)))
    vectorSource.addFeature(bussMarker);

    setTimeout(getDataAndUpdateMap, updateFrequency);
  });
}


function lerp (start, end, amt){
  return (1-amt)*start+amt*end
}