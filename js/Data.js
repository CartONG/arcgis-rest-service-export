window.app = window.app || {}

$(document).ready(function() {

  window.app.Data = function(conf) {
    if (!conf) { return }
    
    this.model = conf.model
    this.url = conf.url
    this.csvConf = conf.csv || {}
    
  }

  window.app.Data.prototype.modelize = function(raw) {
    this.data = []
    for (var i=0; i<raw.length; i++) {
      const record = {}
      for (var attr in this.model) {
        const rawAlias = this.model[attr]
        record[attr] = raw[i][rawAlias]
      }
      this.data.push(record)
    }
  }

  window.app.Data.prototype.read = function() {
    var promise = $.Deferred()

    $.ajax({
      url: this.url,
      dataType: "text"
    })
    .done(function(text) {
      const rawData = Papa.parse(text, this.csvConf).data

      this.modelize(rawData)

      promise.resolve(this.data)
    }.bind(this))
    .fail(function(err) {
      promise.reject('Error reading data', err)
    });

    return promise
  }

})