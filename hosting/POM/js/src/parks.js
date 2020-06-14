var Fuse = require('fuse.js').default

async function parksLoad () {
  if (!window.db) {
    console.log('DB not ready yet, unable to load parks')
    $('body').on('dbLoaded', function () {
      console.log('DB Loaded, loading parks')
      parksLoad()
    })
    return
  }

  console.log('Loading parks')
  var parkDocs = await window.db.collection('parks').get()
  var parks = []
  parkDocs.forEach(function (parkDoc) {
    var park = parkDoc.data()
    park.id = parkDoc.id
    // name.name is the default name, planning on eventually having
    // name.EN name.DE etc...
    park.nameDefault = park.name.name

    park.country = park.location.address.country
    parks.push(park)
  })

  console.log(parks)

  console.log('Loading jsGrid')
  $('#parksJSGrid').jsGrid({
    height: 'auto',
    width: '100%',

    sorting: true,
    filtering: true,
    paging: true,

    rowClick: function (args) {
      console.log('jsGrid row click')
      console.log(args)
      window.router.navigate(
        window.router.generate('park.edit', { pageId: args.item.id })
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
      { title: 'Country', name: 'country', type: 'text', width: 50 },
      {
        title: '',
        type: 'text',
        width: 50,
        itemTemplate: function (value, item) {
          if (item.country) {
            return `<img src="/svg/flags/${item.country}.svg" class="card-img-top" alt="image" style="width:50px;">`
          }
          return ''
        }
      },
      {
        title: 'Active',
        name: 'active',
        type: 'checkbox',
        width: 50,
        filtercss: 'itemsjsGridActiveCheckbox'
      },
      {
        title: 'Ridecount',
        name: 'ridecount',
        type: 'checkbox',
        width: 50,
        filtercss: 'itemsjsGridActiveCheckbox'
      }
    ],
    controller: {
      data: parks,
      loadData: function (filter) {
        console.log(Fuse)
        console.log('Loading data')
        console.log(filter)
        var filteredItems = $.grep(parks, function (park) {
          if (typeof filter.active === 'boolean') {
            if (filter.active !== park.active) {
              return false
            }
          }
          return true
        })
        console.log('Filtered by active')
        console.log(filteredItems)

        filteredItems = $.grep(filteredItems, function (park) {
          if (typeof filter.ridecount === 'boolean') {
            if (filter.ridecount !== park.ridecount) {
              return false
            }
          }
          return true
        })
        console.log('Filtered by ride count')
        console.log(filteredItems)

        if (filter.id) {
          var idFilterFuse = new Fuse(filteredItems, {
            keys: ['id']
          })
          filteredItems = idFilterFuse.search(filter.id).map(function (item) {
            return item.item
          })
        }
        console.log('Filtered by ID')
        console.log(filteredItems)

        if (filter.nameDefault) {
          var nameFilterFuse = new Fuse(filteredItems, {
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

        if (filter.country) {
          var countryFilterFuse = new Fuse(filteredItems, {
            keys: ['country']
          })
          filteredItems = countryFilterFuse
            .search(filter.country)
            .map(function (item) {
              return item.item
            })
        }
        console.log('Filtered by country')
        console.log(filteredItems)

        return filteredItems
      }
    }
  })
  $('#parksJSGrid').jsGrid('search')
}

export { parksLoad }
