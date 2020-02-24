var correllationId
var errorCode

function initRidecountPage () { // eslint-disable-line no-unused-vars
  if (firebase.auth().currentUser) {
    var dataGetPromises = [
      db.collection('Parks').where('Active', '==', true).get(),
      db.collection('Users').doc(firebase.auth().currentUser.uid).collection('RideCount').orderBy('Date', 'desc').limit(12).get()
    ]
    Promise.all(dataGetPromises).then(function (PromiseResults) {
      console.log(PromiseResults)

      var Data = {
      }

      PromiseResults.forEach(function (PromiseResult) {
        console.log(PromiseResult)

        switch (PromiseResult._originalQuery.path.segments[0]) {
          case 'Parks':
            var ParkDocs = PromiseResult
            console.log(ParkDocs)
            Data.Parks = {}
            ParkDocs.forEach(function (ParkDoc) {
              console.log(`Loading park: ${ParkDoc.id}`)
              Data.Parks[ParkDoc.id] = ParkDoc.data()
            })
            break
          case 'Users':
            var TripDocs = PromiseResult
            console.log(TripDocs)
            Data.Trips = {}
            TripDocs.forEach(function (TripDoc) {
              var Trip = TripDoc.data()
              Trip.id = TripDoc.id
              Trip.User = TripDoc.ref.path.split('/')[1]
              Trip.DateString = moment(Trip.Date.toDate()).calendar(null, {
                sameDay: '[Today]',
                nextDay: '[Tomorrow]',
                nextWeek: 'dddd',
                lastDay: '[Yesterday]',
                lastWeek: '[Last] dddd',
                sameElse: 'DD/MM/YYYY'
              })
              Data.Trips[TripDoc.id] = Trip
            })
            break
          default:
            console.log(`Unknown segment: ${PromiseResult._originalQuery.path.segments[0]}`)
            break
        };
      })
      console.log(Data)
      if (!Data.Trips) {
        console.log('No trips')
      } else {
        var compiledTemplateRidecountMyTripsRowDivTrip = Template7.compile($('#TemplateRidecountMyTripsRowDivTrip').html())
        Object.keys(Data.Trips).forEach(function (TripId) {
          var trip = Data.Trips[TripId]
          trip.park = Data.Parks[trip.Park]
          console.log(trip)
          $('#RidecountMyTripsRowDiv').append(compiledTemplateRidecountMyTripsRowDivTrip(trip))
        })
      };
    })
  };
};

function initRidecountUserPage () { // eslint-disable-line no-unused-vars
  var stateurl = window.location.href.split('?')[0].split('#')[0].split('/')
  console.log(stateurl)
  stateurl.splice(0, 3)
  console.log(stateurl)

  console.log(`Looking up user id for user: ${stateurl[1]}`)
  db.collection('Users').where('Username', '==', stateurl[1]).where('Public', '==', true).limit(1).get().then(function (userDocs) {
    if (userDocs.empty) {
      console.log('User not found')
      load404()
      return
    } else {
      console.log('User found')
      var userDoc = userDocs.docs[0]
      console.log(userDoc)
    };
  }).catch(function (errorObject) {
    console.log('Error looking up user id by username')
    correllationId = uuidv4()
    errorCode = 'PPERRCUSRLK'
    bugsnagClient.notify(errorObject, {
      metaData: { correllationId: correllationId, ErrorCode: errorCode },
      severity: 'error'
    })
  })
};
