const Fuse = require('fuse.js').default

async function parksLoadEdit (params) {
  let parkDoc
  if (!window.db) {
    console.log('DB not ready yet, unable to load parks')
    $('body').on('dbLoaded', function () {
      console.log('DB Loaded, loading parks edit')
      parksLoadEdit(params)
    })
    return
  }
  if (!window.storage) {
    console.log('Storage not ready yet, unable to load park edit page')
    $('body').on('storageLoaded', function () {
      console.log('Storage Loaded, loading parks edit page')
      parksLoadEdit(params)
    })
    return
  }

  $('#parkEditFieldMiscLogo').change(function (event) {
    console.log(event)
    $('#parkEditFieldMiscLogoImg').attr(
      'src',
      $('#parkEditFieldMiscLogo').val()
    )
  })
  $('#parkEditFormGroupClosedMessage').change(function (event) {
    if ($('#parkEditFormGroupClosedMessage').attr('checked')) {
      $('#parkEditFormGroupClosedMessage').hide()
      $('#parkEditFieldClosedMessage').val('')
    } else {
      $('#parkEditFormGroupClosedMessage').show()
      if (parkDoc && parkDoc.data()) {
        $('#parkEditFieldClosedMessage').val(parkDoc.data().closedMessage)
      }
    }
  })

  if (params && params.parkId) {
    console.log('Loading park to edit')
    $('.showIfParkEdit').show()
    $('.showIfParkAdd').hide()

    parkDoc = await window.db.collection('parks').doc(params.parkId).get()
    console.log(parkDoc.id)
    console.log(parkDoc.data())
    const parkName = parkDoc.data().name.name

    $('.parkEditName').text(parkName)
    $('#parkEditFieldName').val(parkName)

    $('#parkEditFieldWebsite').val(parkDoc.data().website)

    $('#parkEditFieldAddressAddr1').val(parkDoc.data().location.address.addr1)
    $('#parkEditFieldAddressAddr2').val(parkDoc.data().location.address.addr2)
    $('#parkEditFieldAddressCity').val(parkDoc.data().location.address.city)
    $('#parkEditFieldAddressPostalCode').val(
      parkDoc.data().location.address.postalCode
    )
    $('#parkEditFieldAddressState').val(parkDoc.data().location.address.state)
    $('#parkEditFieldAddressCountry').val(
      parkDoc.data().location.address.country
    )

    $('#parkEditFieldLocationLat').val(
      parkDoc.data().location.coordinates.latitude
    )
    $('#parkEditFieldLocationLon').val(
      parkDoc.data().location.coordinates.longitude
    )

    $('#parkEditFieldMiscLogo').val(parkDoc.data().logo)
    $('#parkEditFieldMiscLogoImg').attr('src', parkDoc.data().logo)

    $('#parkEditFieldOpen').attr('checked', parkDoc.data().open)
    if (parkDoc.data().open) {
      $('#parkEditFormGroupClosedMessage').hide()
      $('#parkEditFieldClosedMessage').val('')
    } else {
      $('#parkEditFormGroupClosedMessage').show()
      $('#parkEditFieldClosedMessage').val(parkDoc.data().closedMessage)
    }

    $('#parkEditAttractionsButton').on('click', function () {
      const parkId = window.router.lastRouteResolved().params.parkId
      window.router.navigate(
        window.router.generate('park.attractions.list', { parkId: parkId })
      )
    })
  } else {
    console.log('New park page, no park to load')

    $('.showIfParkEdit').hide()
    $('.showIfParkAdd').show()
  }

  $('#parkEditSaveButton').on('click', async function () {
    console.log('Save button clicked')
    const params = window.router.lastRouteResolved().params
    const parkName = $('#parkEditFieldName').val()
    const parkWebsite = $('#parkEditFieldWebsite').val()
    const parkAddr1 = $('#parkEditFieldAddressAddr1').val()
    const parkAddr2 = $('#parkEditFieldAddressAddr2').val()
    const parkCity = $('#parkEditFieldAddressCity').val()
    const parkPostalCode = $('#parkEditFieldAddressPostalCode').val()
    const parkState = $('#parkEditFieldAddressState').val()
    const parkCountry = $('#parkEditFieldAddressCountry').val()
    const parkLat = $('#parkEditFieldLocationLat').val()
    const parkLon = $('#parkEditFieldLocationLon').val()
    const parkLogo = $('#parkEditFieldMiscLogo').val()
    const parkOpen = $('#parkEditFieldOpen').prop('checked')
    const parkClosedMessage = $('#parkEditFieldClosedMessage').val()
    if (!parkName) {
      return window.alert('Park name is required')
    }
    if (!parkWebsite) {
      return window.alert('Park website is required')
    }
    if (!parkCountry) {
      return window.alert('Park country is required')
    }
    if (params && params.parkId) {
      console.log('Saving park')
    } else {
      console.log('Adding park')
      await window.db
        .collection('parks')
        .doc()
        .set({
          active: false,
          created: window.firebase.firestore.FieldValue.serverTimestamp(),
          updated: window.firebase.firestore.FieldValue.serverTimestamp(),
          creationSource: 'POM',
          addedBy: window.auth.currentUser.uid,
          location: {
            address: {
              addr1: parkAddr1,
              addr2: parkAddr2,
              city: parkCity,
              country: parkCountry,
              postalCode: parkPostalCode,
              postalState: parkState
            },
            coordinates: {
              latitude: Number(parkLat),
              longitude: Number(parkLon)
            }
          },
          maps: false,
          name: {
            name: parkName
          },
          open: parkOpen,
          closedMessage: parkClosedMessage,
          queuetimes: false,
          ridecount: true,
          website: parkWebsite,
          logo: parkLogo
        })
      console.log('Saved!')
      window.alert(`Successfully added ${parkName}`)
      window.router.navigate(window.router.generate('parks.list'))
    }
  })
}

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
  const parkDocs = await window.db.collection('parks').get()
  const parks = []
  parkDocs.forEach(function (parkDoc) {
    const park = parkDoc.data()
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
        window.router.generate('park.edit', { parkId: args.item.id })
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
        title: 'Queue times',
        name: 'queuetimes',
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
        let filteredItems = $.grep(parks, function (park) {
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

        if (filter.country) {
          const countryFilterFuse = new Fuse(filteredItems, {
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

export { parksLoad, parksLoadEdit }
