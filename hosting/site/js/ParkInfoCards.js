var correllationId
function fetchParkInfoCards () { // eslint-disable-line no-unused-vars
  var templateParkInfoCard = $('#TemplateParkInfoCard').html()
  if (!templateParkInfoCard) {
    clearTimeout(window.parkInfoCardsOnSnapshotLastUpdatedTimeout)
    return
  };
  var compiledTemplateParkInfoCard = Template7.compile(templateParkInfoCard)

  var compiledTemplateParkInfoCardQueueTime = Template7.compile($('#TemplateParkInfoCardQueueTime').html())

  if (window.parkInfoCardsOnSnapshot) {
    window.parkInfoCardsOnSnapshot()
    if (window.parkInfoCardsQueuesOnSnapshots) {
      window.parkInfoCardsQueuesOnSnapshots.forEach(function (queueOnSnapshot) {
        queueOnSnapshot()
      })
    } else {
      window.parkInfoCardsQueuesOnSnapshots = []
    };
    clearTimeout(window.parkInfoCardsOnSnapshotLastUpdatedTimeout)
  } else {
    window.parkInfoCardsQueuesOnSnapshots = []
  };
  window.parkInfoCardsOnSnapshotLastUpdatedTimeout = setTimeout(function () {
    fetchParkInfoCards()
  }, 60000)
  window.parkInfoCardsOnSnapshot = db.collection('Parks').where('Active', '==', true).limit(3).onSnapshot(parkInfoSnapshot => {
    parkInfoSnapshot.docChanges().forEach(function (parkInfoDocChange) {
      var parkInfoDoc = parkInfoDocChange.doc
      var queueTimesHtml

      switch (parkInfoDocChange.type) {
        case 'added':
          console.log(`${parkInfoDoc.data().Name} Added to query results`)

          if ($(`#ParkInfoCard_${parkInfoDoc.id}`).length) {
            queueTimesHtml = $(`#ParkInfoCard_${parkInfoDoc.id}`).find('.ParkInfoCardQueueTimes').html()
            $(`#ParkInfoCard_${parkInfoDoc.id}`).replaceWith(compiledTemplateParkInfoCard(parkInfoDoc))
            $(`#ParkInfoCard_${parkInfoDoc.id}`).find('.ParkInfoCardQueueTimes').html(queueTimesHtml)
            return
          };

          $('#ParkInfoCards').append(compiledTemplateParkInfoCard(parkInfoDoc))
          window.parkInfoCardsQueuesOnSnapshots.push(parkInfoDoc.ref.collection('Rides').where('QueueTimes', '==', true).orderBy('QueueTime', 'desc').limit(3).onSnapshot(queueInfoSnapshot => {
            console.log(queueInfoSnapshot)
            if (queueInfoSnapshot.empty) {
              return
            };
            var parkDocId = queueInfoSnapshot.docs[0].ref.path.split('/')[1]
            $(`#ParkInfoCard_${parkDocId}`).find('.ParkInfoCardQueueTimes').empty()
            queueInfoSnapshot.forEach(function (rideDoc) {
              console.log(rideDoc)
              $(`#ParkInfoCard_${parkDocId}`).find('.ParkInfoCardQueueTimes').append(compiledTemplateParkInfoCardQueueTime(rideDoc))
            })
          }, errorObject => {
            console.log(errorObject)
            correllationId = uuidv4()
            var errorCode = 'PPERPKINFCDQU'
            bugsnagClient.notify(errorObject, {
              metaData: { correllationId: correllationId, errorCode: errorCode },
              severity: 'error'
            })
          }))
          break
        case 'modified':
          console.log(`${parkInfoDoc.data().Name} changed`)
          queueTimesHtml = $(`#ParkInfoCard_${parkInfoDoc.id}`).find('.ParkInfoCardQueueTimes').html()
          $(`#ParkInfoCard_${parkInfoDoc.id}`).replaceWith(compiledTemplateParkInfoCard(parkInfoDoc))
          $(`#ParkInfoCard_${parkInfoDoc.Id}`).find('.ParkInfoCardQueueTimes').html(queueTimesHtml)
          break
        case 'removed':
          console.log(`${parkInfoDoc.data().Name} Removed from query results`)
          $(`#ParkInfoCard_${parkInfoDoc.id}`).remove()
          break
      };
    })
  }, errorObject => {
    console.log(errorObject)
    correllationId = uuidv4()
    var errorCode = 'PPERPKINFCDQU'
    bugsnagClient.notify(errorObject, {
      metaData: { correllationId: correllationId, errorCode: errorCode },
      severity: 'error'
    })
  })
};

function parkClosingDisplayDateTime (closingDate) { // eslint-disable-line no-unused-vars
  var difference = moment(closingDate.toDate()).startOf('day').diff(moment().startOf('day'), 'days')
  var closingDay
  var closingTime
  console.log(difference)
  switch (difference) {
    case 0:
      console.log('Today')
      closingDay = ''
      closingTime = moment(closingDate.toDate()).format('HH:mm')
      break
    case 1:
      console.log('Tomorrow')
      closingDay = 'Tomorrow'
      closingTime = moment(closingDate.toDate()).format('HH:mm')
      break
    case 2:
    case 3:
    case 4:
    case 5:
    case 6:
      console.log('Upcoming weekday')
      closingDay = moment(closingDate.toDate()).format('dddd')
      closingTime = moment(closingDate.toDate()).format('HH:mm')
      break
    default:
      console.log('Not tommrow')
      closingDay = moment(closingDate.toDate()).format('dddd Do MMMM YYYY')
      closingTime = moment(closingDate.toDate()).format('HH:mm')
      break
  };
  console.log(`Closes ${closingDay} at ${closingTime}`)
  return (`Closes ${closingDay} at ${closingTime}`)
};

function ParkOpeningClosingDisplayDateTime (openingDate, closingDate) { // eslint-disable-line no-unused-vars
  var difference = moment(openingDate.toDate()).startOf('day').diff(moment().startOf('day'), 'days')
  console.log(difference)

  var openingDay
  var openingTime
  var closingDay
  var closingTime

  switch (difference) {
    case 0:
      console.log('Today')
      openingDay = 'Today'
      openingTime = moment(openingDate.toDate()).format('HH:mm')
      break
    case 1:
      console.log('Tomorrow')
      openingDay = 'Tomorrow'
      openingTime = moment(openingDate.toDate()).format('HH:mm')
      break
    case 2:
    case 3:
    case 4:
    case 5:
    case 6:
      console.log('Upcoming weekday')
      openingDay = moment(openingDate.toDate()).format('dddd')
      openingTime = moment(openingDate.toDate()).format('HH:mm')
      break
    default:
      console.log('Not tommrow')
      openingDay = moment(openingDate.toDate()).format('dddd Do MMMM YYYY')
      openingTime = moment(openingDate.toDate()).format('HH:mm')
      break
  };

  difference = moment(closingDate.toDate()).startOf('day').diff(moment().startOf('day'), 'days')
  console.log(difference)
  switch (difference) {
    case 0:
      console.log('Today')
      closingDay = 'Today'
      closingTime = moment(closingDate.toDate()).format('HH:mm')
      break
    case 1:
      console.log('Tomorrow')
      closingDay = 'Tomorrow'
      closingTime = moment(closingDate.toDate()).format('HH:mm')
      break
    case 2:
    case 3:
    case 4:
    case 5:
    case 6:
      console.log('Upcoming weekday')
      closingDay = moment(closingDate.toDate()).format('dddd')
      closingTime = moment(closingDate.toDate()).format('HH:mm')
      break
    default:
      console.log('Not tommrow')
      closingDay = moment(closingDate.toDate()).format('dddd Do MMMM YYYY')
      closingTime = moment(closingDate.toDate()).format('HH:mm')
      break
  };
  console.log(`Opens ${openingDay} ${openingTime}, Closes ${closingDay} ${closingTime}`)
  return (`Opens ${openingDay} ${openingTime}, Closes ${closingDay} ${closingTime}`)
};
