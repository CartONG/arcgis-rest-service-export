window.app = window.app || {}

$(document).ready(function() {

  const Defaults = {
    lat: 34.2,
    lng: 18.2,
    zoom: 3
  }

  const Basemaps = {
    osm_mapnik: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }),
    osm_BlackAndWhite: L.tileLayer('https://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }),
    esri_WorldStreetMap: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
    }),
    esri_WorldImagery: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }),
    hydda_RoadsAndLabels: L.tileLayer('https://{s}.tile.openstreetmap.se/hydda/roads_and_labels/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    })
  }

  window.app.Map = function(id, custom) {
    if (!id) { return }
    
    this.id = id
    this.conf = custom || Defaults
    this.datasets = {}
    this.layers = {}
    this.datasetCounter = 0
    
    this.map = L.map(this.id).setView([this.conf.lat, this.conf.lng], this.conf.zoom)
    
    Basemaps.osm_BlackAndWhite.addTo(this.map)
    
    
    //this.map.on('moveend', onMoveEnd);
    
    
    
    return this
  }
  
  window.app.Map.prototype.addData = function(data, layerOpts) {
    const index = this.datasetCounter
    this.datasets[index] = data
    
    //this.layers[index] = L.markerClusterGroup();
    this.layers[index] = L.layerGroup();

    if (layerOpts) {

      for (var i = 0; i<this.datasets[index].length; i++) {
        const record = this.datasets[index][i]
        const marker = L.circleMarker([record.lat, record.lng])
        //const marker = L.circleMarker(new L.LatLng(record.lat, record.lng), { name: record.name })
        marker.bindPopup(buildPopup(record))

        this.layers[index].addLayer(marker);
      }

      if (layerOpts.show) {
        this.map.addLayer(this.layers[index]);
      }

    }
    
    this.datasetCounter ++
  }

  function buildPopup(data) {
    return '<div>'+
      '<h1>'+data.name+'</h1>'+
      '<a href="'+data.link+'" target="_blank">PDF</a>'+
      '<div>'
  }

  /*
  function onMoveEnd(e) {
    console.log("You are at " + this.getCenter())
  }
  */
  

})