//window.app = window.app || {}

$(document).ready(function() {

  
  // init objects
  var dom = app.Dom,
      view = app.View(dom)
      //map = new app.Map(dom.map) //, Config.map),
      //data = new app.Data(Config.datasources[0])
      
 
  // actions
  view.onServiceURLKeypress(appFunction)
  view.onServiceURLClick(appFunction)

  function appFunction(input) {


    var service = new CartONG.ArcgisService(input.url)
    var params = {
      returnGeometry: input.returnGeometry,
      f: input.outFormat == 'geojson' ? 'geojson' : 'json'
    }
    
    // TODO: time check?

    $.when(service.loadDefinition())
      .done(function(serviceDefinition) {
        console.log(serviceDefinition)
        var serviceMeta = {
          version: serviceDefinition.currentVersion,
          type: serviceDefinition.type,
          capabilities: serviceDefinition.capabilities,
          supportedQueryFormats: serviceDefinition.supportedQueryFormats,
          maxRecordCount: serviceDefinition.maxRecordCount
        }
        service.getData(params)
          .done(function(data) {
            console.log('Success!')
            //data = new Data(data)
            var print
            var featureArray

            //download file instead of printing, specially for big files!
            if (input.outFormat == 'csv') {
              //adapt features to csv array
              featureArray = service.features2csv(data, 'json', input.returnGeometry)
              
              //transform to papaparse
              print = Papa.unparse(featureArray)
            }
            else {
              print = JSON.stringify(data, undefined, 2)
            }

            //console.log(print)
            view.showResult({
              success: true,
              features: print,
              featuresLength: data.features.length,
              format: input.outFormat
            })

            view.onExportClick(function(exportFormat) {
              //console.log(exportFormat)
              var exportData;
              if (exportFormat === 'csv') {
                if (!featureArray) {
                  featureArray = service.features2csv(data, input.outFormat)
                }
                exportData = Papa.unparse(featureArray)
              }
              else { exportData = data}

              service.export(exportData, exportFormat)
            })

          })
          .fail(function(res) {
            //view.showResult(JSON.stringify(err, undefined, 2))
            var metaText = ' Service description:\n' + (JSON.stringify(serviceMeta, undefined, 2))
            console.log('Error!')
            view.showResult({ success: false, message: (res.message || res.error.message) + metaText })
          })
      })
      .fail(function(res) {
        console.log('Error!')
        view.showResult({ success: false, message: res.error.message + ' Error onsService definition request.' })
      });

  }

});