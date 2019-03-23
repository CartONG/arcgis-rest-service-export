const Config = {
  datasources: [
    {
      name: 'Cuevas',
      url: 'data/cuevas.csv',
      model: {
        name: 'name',
        link: 'pdf',
        description: 'description',
        type: 'type',
        lat: 'latitude',
        lng: 'longitude'
      },
      csv: { // follow papaparse docs: https://www.papaparse.com/docs#config
        header: true,
        skipEmptyLines: true
      }
    }
  ],
  map: {
    lat: 42.46298,
    lng: -2.386436,
    zoom: 11
  }
}