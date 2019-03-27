var CartONG = window.CartONG || {};

$(function() {
  
  var defaultQueryParams = {
    where: '1=1',
    text: null,
    objectIds: null,
    time: null,
    geometry: null,
    geometryType: 'esriGeometryEnvelope',
    geometryPrecision: 6,
    inSR: null,
    outSR: null, //4326,
    spatialRel: 'esriSpatialRelIntersects',
    relationParam: null,
    maxAllowableOffset: null,
    outFields: '*',
    orderByFields: null,
    groupByFieldsForStatistics: null,
    outStatistics: null,
    gdbVersion: null,
    datumTransformation: null,
    parameterValue: null,
    rangeValues: null,
    resultOffset: 0,
    resultRecordCount: null,
    returnGeometry: true,
    returnZ: false,
    returnM: false,
    returnIdsOnly: false,
    returnCountOnly: false,
    returnDistinctValues: false,
    returnTrueCurves: false,
    returnExtentsOnly: false,
    queryByDistance: null,
    f: 'json' //'geojson'
  };

  CartONG.ArcgisService = function (opts) {
    
    //TODO: handle different CRS? different geometry types...
    //TODO: handle token (already applied on save function)

    
    //set parameters
    if (typeof opts === 'string' && opts != '') {
      this.url = opts;
    }
    else if (opts.url) {
      this.url = opts.url;
      //TODO: build domain, servicePath and serviceID [low priority]
    }
    else {
      if (!opts.domain || opts.domain == '' || !opts.servicePath || opts.servicePath == '' || !opts.serviceId || opts.serviceId == '') {
        console.error('CartONG.ArcgisService.init: not enough parameters to create url, please check you added either url OR domain, servicePath and serviceID.');
        return;
      }
      else {
        this.domain = opts.domain;
        this.servicePath = opts.servicePath;
        this.serviceId = opts.serviceId;
        
        this.url = this.domain + this.servicePath + this.serviceId;
      }
      
    }
    this.token = opts.token || null;
    this.definitionUrl = this.url + '?f=pjson';
    this.mapServiceQueryUrl = '/query?where={where}&text=&objectIds={objectIdList}&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&outSR=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&f=pjson';
    this.maxIdUrl = this.url + '/query?where=1%3D1&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=&returnGeometry=true&maxAllowableOffset=&outSR=4326&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=[{\'statisticType\':\'min\',\'onStatisticField\':\'objectid\',\'outStatisticFieldName\':\'objectid_min\'},{\'statisticType\':\'max\',\'onStatisticField\':\'objectid\',\'outStatisticFieldName\':\'objectid_max\'}]&returnZ=false&returnM=false&gdbVersion=&f=pjson';
    opts.name ? this.name = opts.name : console.warn('CartONG.ArcgisService.init: name not available.');
    this.maxRecordCount = opts.maxRecordCount ? opts.maxRecordCount : ''; //TODO [low priority]: to get maxRecordCount and other meta (SR, geometry type...) from the service itself

    //this.definitionPromise = this.loadDefinition();
  }

  //get parameter functions
  CartONG.ArcgisService.prototype.getName = function() {
    return (this.name && this.name != '') ? this.name : 'Not available';
  }
  CartONG.ArcgisService.prototype.getUrl = function() {
    return (this.url && this.url != '') ? this.url : 'Not available';
  }
  CartONG.ArcgisService.prototype.getDomain = function() {
    return (this.domain && this.domain != '') ? this.domain : 'Not available';
  }
  CartONG.ArcgisService.prototype.getServicePath = function() {
    return (this.servicePath && this.servicePath != '') ? this.servicePath : 'Not available';
  }
  CartONG.ArcgisService.prototype.getServiceId = function() {
    return (this.serviceId && this.serviceId != '') ? this.serviceId : 'Not available';
  }
  CartONG.ArcgisService.prototype.getMaxRecordCount = function() {
    return (this.maxRecordCount && this.maxRecordCount != '') ? this.maxRecordCount : 'Not available';
  }
  CartONG.ArcgisService.prototype.getToken = function() {
    return (this.token && this.token != '') ? this.token : 'Not available';
  }
  CartONG.ArcgisService.prototype.setToken = function(token) {
    if (!token) {return}
    this.token = token;
  }
  
  CartONG.ArcgisService.prototype.loadDefinition = function() {

    var promise = $.Deferred();

    var params = {};
    if (this.token) { params.token = this.token; }
    
    $.ajax({
      url: this.definitionUrl,
      data: params,
      dataType: 'json'
    })
      .done(function(json) {
        if (json.error) {
          promise.reject({
            error: { message: 'Service error: ' + json.error.message + '. Token secured services are not supported yet, coming soon.' }
          });
        }
        else {
          this.definition = json;
          promise.resolve(json);
        }
      }.bind(this))
      .fail(function(err) {
        var msgError = 'Service error'
        msgError += (err.status == 404) ? (': ' + err.statusText + '.') : '.' ;
        promise.reject({
          error: { message: msgError}
        });
      });

    return promise;
  }

  /**
   * Function to download features from the service. Default parameters are used if they are not given as input.
   */
  CartONG.ArcgisService.prototype.getData = function(params) {
    var promise = $.Deferred();

    this.query(params)
      .done(function(json) {
        if (json.features === undefined) {
          promise.reject({
            error: { message: 'No features in the result.' }
          });
          return;
        }        
        //promise.resolve(json.features);
        promise.resolve(json);
      })
      .fail(function(err) {
        const msgError = (err.error ? err.error.message : '')
        promise.reject({
          error: { message: 'Service error' + (msgError != '' ? ': ' + msgError : '' ) + '.' }
        });
      });
    
    return promise;
  }
  
  CartONG.ArcgisService.prototype.getDataByAttribute = function(attribute,params) {
    var promise = $.Deferred();
    
    if (attribute.length != 2) { 
      console.warn('CartONG.ArcgisService.getDataByAttribute: attribute not available.');
      return;
    }
    
    var queryUrl = setParams(this.mapServiceQueryUrl, {
      where: attribute[0] + '+IN+%28%27' + attribute[1].toString() + '%27%29'
    });
    //var fullUrl = this.url + queryUrl;
    //this.query(fullUrl, params)
    this.query(queryUrl, params)
      .done(function(json) {
        if (json.features === undefined) {
          promise.reject([]);
          return;
        }
        json = truncateCoordinates(json);
        promise.resolve(json.features);
      })
      .fail(function(err) {
        promise.reject(err);
      });
    
    return promise;
  }
  
  // Query functions
  CartONG.ArcgisService.prototype.query = function(params) {
    var promise = $.Deferred();

    //var queryParams = {}
    params = params || {};
    params.resultOffset = 0;

    this.queryNextFeatures(params, [], promise);

    return promise;
  }

  CartONG.ArcgisService.prototype.queryNextFeatures = function(params, features, promise) {
    
    var maxObjects = this.definition.maxRecordCount || 995;
    //const outFormat = params.f

    const queryUrl = getEsriURL({
      url: this.url,
      params: params
    });

    $.getJSON(queryUrl)
      .done(function(res) {
        if (res.error) {
          //debugger
          promise.reject(res)
        }
        else {

          res.features.forEach(function(feature) {
            features.push(feature);
          });
    
          if (res.features.length === maxObjects) {
            params.resultOffset += maxObjects;
            this.queryNextFeatures(params, features, promise);
          } else {

            var output = res;
            output.features = features;

            promise.resolve(output);

          }
          
        }
      }.bind(this))
      .fail(function(err) {
        //debugger
        promise.reject(err)
      })

  
  }

  CartONG.ArcgisService.prototype.features2csv = function(data, format, geometry) {

    var features = [];
    var crs;
    var geometryType;

    if (geometry) {
      if (format === 'geojson') {
        crs = data.crs.properties.name;
      }
      else if (format === 'json') {
        crs = data.spatialReference.wkid;
        geometryType = data.geometryType
      }
    }

    data.features.forEach(function(feature) {
      var csv;
      //var properties = feature.properties || features.attributes
      if (format === 'geojson') {
        csv = feature.properties;
        if (geometry) {
          csv.geometryType = feature.geometry.type;
          //csv.geometryCoordinates = feature.geometry.coordinates;
          csv.x = feature.geometry.coordinates[0];
          csv.y = feature.geometry.coordinates[1];
          csv.crs = crs;
        }
      }
      else if (format === 'json') {
        csv = feature.attributes;
        if (geometry) {
          csv.geometryType = geometryType;
          //csv.geometryCoordinates = feature.geometry;
          csv.x = feature.geometry.x;
          csv.y = feature.geometry.y;
          csv.crs = crs;
        }
      }

      //TODO: trim values
      
      features.push(csv);      
      //features.push(feature);
    });

    return features;

  }

  CartONG.ArcgisService.prototype.export = function(data, format, name) {
    
    var d = new Date().getDate()
		var m = new Date().getMonth() + 1 //January is 0!
		var y = new Date().getFullYear()
    var today = "_" + y + m + d
    
    var filename = "export" + (name ? '_name' : '') + today

    if (format === 'geojson' || format === 'json') {
      //data = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data))
      data = JSON.stringify(data, undefined, 2)
    }
    
    if (format === 'csv' || format === 'geojson' || format === 'json') {
      
      var blob = new Blob(["\ufeff", data])
      var url = URL.createObjectURL(blob)
      
      var downloadLink = document.createElement("a")
      downloadLink.href = url
      downloadLink.download = filename + '.' + format

      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
    }

    /*
    else if (format == 'geojson' || format == 'json') {
      
      var dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));
      
      var downloadLink = document.createElement('a')
      //downloadLink.href = dataStr
      //downloadLink.download = filename + ".json"
      downloadLink.setAttribute("href", dataStr);
      downloadLink.setAttribute("download", filename + ".json");
      
      document.body.appendChild(downloadLink) // required for firefox
      downloadLink.click()
      downloadLink.remove()
    }
    */

  }


  /**
   * CRUD dependency
   */
  CartONG.ArcgisService.prototype.delete = function(objectid, callback){
    var promise = $.Deferred()
    if (!objectid || isNaN(objectid)) {
      console.log('CartONG.ArcgisService - delete: param missing');
      promise.resolve()
      return;
    }

    var crud = new CRUD(this.url);
    
    var deleteFeature = {
			token: this.token.getToken(),
			feature: Number(objectid)
		}
    crud.delete(deleteFeature, callback)
      .then(function(response) {
        switch (response[0]) {
          case 1:
          case 2:
          case 3:
            promise.resolve(response[1])
            break;
          case 4:
          case 5:
            promise.reject(response[1])
            break;
          default:
            promise.reject('CRUD: Unexpected error')
            break;
        }
      })
      .fail(function(response) {
        promise.reject(response[1])
      });
    return promise
  }

  /**
   * CRUD dependency
   */
  CartONG.ArcgisService.prototype.save = function(features, action, callback){
    var promise = $.Deferred()
    if (!features || !features.push || !features.length || !action) {
      console.log('CartONG.ArcgisService - save: param missing');
      promise.resolve()
      return;
    }

    var crud = new CRUD(this.url);
    var feature_string = JSON.stringify(features);
    //console.log(feature_string);

    var params = {};
    params.feature = feature_string;
    if (this.token) { params.token = this.token.getToken(); }

    console.log(params);
    crud[action](params, callback)
      .then(function(response) {
        switch (response[0]) {
          case 1:
          case 2:
          case 3:
            promise.resolve(response[1])
            break;
          case 4:
          case 5:
            promise.reject(response[1])
            break;
          default:
            promise.reject('CRUD: Unexpected error')
            break;
        }
      })
      .fail(function(response) {
        promise.reject(response[1])
      });

    return promise
  }


  /**
   * Function to build the url to an arcgis rest service
   * @param {object} endpoint Object with url and params attributes. This params attribute is used to build the structure of the query. E.g.: { where: 'iso3={iso3}' }
   * @param {*} params Object with params to replace variables in the structure build with previous endpoint object. E.g. { iso3='NPL' }
   */
  function getEsriURL(endpoint, params) {
    var
      query = '',
      separator = '',
      key, val;
  
    endpoint.params = endpoint.params || {};
  
    for (key in defaultQueryParams) {
      val = typeof endpoint.params[key] !== 'undefined' ? endpoint.params[key] : defaultQueryParams[key];
      if (val !== '' && val !== null) {
        query += separator + key +'='+ encodeURIComponent(setParams(val, params));
        separator = '&';
      }
    }
  
    return setParams(endpoint.url, params) + '/query?' + query;
  };

  function setParams(str, params) {
    //return (str || '').replace(/\{(\w+)\}/g, function(tag, key) {
    //  return params[key] !== undefined ? params[key] : tag;
    //});
    if (!params) {
      return str;
    }
    return ('' + str).replace(/\{([^\{\}]+)\}/g, function(t, k) {
      return params[k] !== undefined ? params[k] : t;
    });
  };





});