window.app = window.app || {};
window.app.View = function(dom) {

  function View(dom) {

    var $dom = {}
    for (var el in dom) {
      $dom[el] = $('#' + dom[el])
    }

    var component = {
      spinner:
        '<div class="spinner-border spinner-border-sm" role="status">'+
          '<span class="sr-only">Loading...</span>'+
        '</div>',
      searchIcon: '<i class="fas fa-search"></i>',
      dropdownButton: '<button class="dropdown-item {class}" type="button" value="{value}">{label}</button>',
      badge: '<span class="badge badge-pill badge-{class}">{message}</span>'
    }

    function setParams(str, params) {
      if (!params) {
        return str;
      }
      return ('' + str).replace(/\{([^\{\}]+)\}/g, function(t, k) {
        return params[k] !== undefined ? params[k] : t;
      });
    };

    function onSearchEnd() {
      $dom.btnInputServiceURL.html(component.searchIcon)
    }
    function onSearchStart() {
      $dom.btnInputServiceURL.html(component.spinner)
      $dom.btnExportData.attr('disabled', true)
      $dom.dropdownExportOptions.html('')
      $dom.txtResultSummary.html('');
    }

    function onDataError(err) {
      console.log('Data Error')
    }

    function onExportClick(callback) {
      $dom.dropdownExportOptions.find('.btn-export-data-format').each(function(e) {
        $(this).click(function() {
          const exportFormat = $(this).val()
          callback(exportFormat)
        })
      })
    }

    function getInputs(callback) {
      const url =  $dom.inputServiceURL.val()
      if (url != '') {
        const input = {
          url: url,
          outFormat: $dom.inputOutputFormat.val(),
          returnGeometry: $dom.inputOutputGeometry.val()
        }
        onSearchStart()
        callback(input)
      }
    }

    function onServiceURLKeypress(callback) {
      $dom.inputServiceURL.keypress(function(ev) {
        if (ev.keyCode == 13) {
          getInputs(callback)
        }
      });
    }
    function onServiceURLClick(callback) {
      $dom.btnInputServiceURL.click(function() {
        getInputs(callback)
      })
    }

    function showResult(res) {
      var print = ''
      if (res.success) {

        if (res.featuresLength) {
          $dom.txtResultSummary.html(setParams(component.badge, {
            message: 'Success! | Number of features: ' + res.featuresLength,
            class: 'info'
          }))
          if (res.featuresLength > 1000) {
            print = 'Too big dataset to print, please download the file with Export button.'
          }
          else {
            print = res.features
          }
        }
        $dom.txtResult.html(print)

        $dom.dropdownExportOptions.html(setParams(component.dropdownButton, {
          class: 'btn-export-data-format',
          value: 'csv',
          label: 'As CSV',
        }))

        if (res.format === 'geojson') {
          $dom.dropdownExportOptions.append(setParams(component.dropdownButton, {
            class: 'btn-export-data-format',
            value: 'geojson',
            label: 'GeoJSON',
          }))
        }
        else {
          $dom.dropdownExportOptions.append(setParams(component.dropdownButton, {
            class: 'btn-export-data-format',
            value: 'json',
            label: 'As Esri JSON',
          }))
        }

        $dom.btnExportData.attr('disabled', false)
      }
      else {
        $dom.txtResult.html(res.message)
        $dom.txtResultSummary.html(setParams(component.badge, {
          message: 'Error!',
          class: 'dark'
        }))
      }
      onSearchEnd()
    }


    return {
      onDataError: onDataError,
      onServiceURLClick: onServiceURLClick,
      onServiceURLKeypress: onServiceURLKeypress,
      onExportClick: onExportClick,
      showResult: showResult
    }
  }

  return View(dom);    
}