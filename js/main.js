//window.app = window.app || {}

$(document).ready(function() {

  
  // init objects
  var dom = app.Dom,
      view = app.View(dom),
      map = new app.Map(dom.map, Config.map),
      caves = new app.Data(Config.datasources[0])

  // carga datos
  caves.read()
    .done(function(data) { map.addData(data, {
      show: true
    }) })
    .fail(view.onDataError())
  /*
  api.characters().then(view.addPersonajes);
  */

  /*
  // acciones
  view.onBuscar(function (ids) {
    $.when(
      api.comics(ids[0]),
      api.comics(ids[1])
    )
    .then(Comics.interseccion)
    .then(view.addComics);
  });
  */

});