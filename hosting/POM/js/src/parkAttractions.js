const Fuse = require('fuse.js').default
const $ = window.$

async function parkAttractionsLoad (params) {
  if (!window.db) {
    console.log('DB not ready yet, unable to load park attractions')
    $('body').on('dbLoaded', function () {
      console.log('DB Loaded, loading park attractions')
      parkAttractionsLoad(params)
    })
    return
  }

  const parkId = params.parkId
  console.log(`Loading park: ${parkId}`)
  const parkDoc = await window.db.collection('parks').doc(parkId).get()
  if (!parkDoc.exists) {
    console.log(`Park with ID: ${parkId} does not exist`)
    window.alert('Park does not exist')
    window.router.navigate(window.router.generate('parks.list'))
    return
  }
  const parkData = parkDoc.data()
  parkData.id = parkDoc.id
  console.log(parkData)
  $('.parkName').text(parkData.name.name)

  console.log('Loading attractions')
  const attractionsDocs = await window.db
    .collection('parks')
    .doc(parkId)
    .collection('rides')
    .get()
  console.log('Got attractions docs')
  console.log(attractionsDocs)

  const attractions = []
  attractionsDocs.forEach(function (attractionDoc) {
    const attraction = attractionDoc.data()
    attraction.id = attractionDoc.id
    // name.name is the default name, planning on eventually having
    // name.EN name.DE etc...
    attraction.nameDefault = attraction.name.name
    attractions.push(attraction)
  })
  console.log(attractions)

  console.log('Loading jsGrid')
  $('#attractionsJSGrid').jsGrid({
    height: 'auto',
    width: '100%',

    sorting: true,
    filtering: true,
    paging: true,

    rowClick: function (args) {
      console.log('jsGrid row click')
      console.log(args)
      const parkId = window.router.lastRouteResolved().params.parkId
      window.router.navigate(
        window.router.generate('park.attractions.view', {
          parkId: parkId,
          attractionId: args.item.id
        })
      )
    },
    onPageChanged: function (args) {
      console.log('jsGrid Page changed')
      // loadItemImages()
    },
    onOptionChanged: function (args) {
      console.log('jsGrid On options changed')
      // loadItemImages()
    },
    fields: [
      { title: 'ID', name: 'id', type: 'text', width: 100 },
      { title: 'Name', name: 'nameDefault', type: 'text', width: 150 },
      {
        title: 'Active',
        name: 'active',
        type: 'checkbox',
        width: 50,
        filtercss: 'itemsjsGridActiveCheckbox'
      },
      {
        title: 'Queue times',
        name: 'queuetimes',
        type: 'checkbox',
        width: 50,
        filtercss: 'itemsjsGridActiveCheckbox'
      }
    ],
    controller: {
      data: attractions,
      loadData: function (filter) {
        console.log(Fuse)
        console.log('Loading data')
        console.log(filter)
        let filteredItems = $.grep(attractions, function (attraction) {
          if (typeof filter.active === 'boolean') {
            if (filter.active !== attraction.active) {
              return false
            }
          }
          return true
        })
        console.log('Filtered by active')
        console.log(filteredItems)

        filteredItems = $.grep(filteredItems, function (park) {
          if (typeof filter.queuetimes === 'boolean') {
            if (filter.queuetimes !== park.queuetimes) {
              return false
            }
          }
          return true
        })
        console.log('Filtered by queuetimes')
        console.log(filteredItems)

        if (filter.id) {
          const idFilterFuse = new Fuse(filteredItems, {
            keys: ['id']
          })
          filteredItems = idFilterFuse.search(filter.id).map(function (item) {
            return item.item
          })
        }
        console.log('Filtered by ID')
        console.log(filteredItems)

        if (filter.nameDefault) {
          const nameFilterFuse = new Fuse(filteredItems, {
            keys: ['nameDefault']
          })
          filteredItems = nameFilterFuse
            .search(filter.nameDefault)
            .map(function (item) {
              return item.item
            })
        }
        console.log('Filtered by name')
        console.log(filteredItems)
        return filteredItems
      }
    }
  })
  $('#attractionsJSGrid').jsGrid('search')

  $('#newAttractionButton').on('click', function () {
    const parkId = window.router.lastRouteResolved().params.parkId
    window.router.navigate(
      window.router.generate('park.attractions.new', { parkId: parkId })
    )
  })
}

export { parkAttractionsLoad }
