window.app = window.app || {};
window.app.View = function(dom) {

  function View(dom) {

    function onDataError(err) {
      console.log('error cargando datos')
    }

    return {
      onDataError: onDataError
    }
  }

  return View(dom);    
}