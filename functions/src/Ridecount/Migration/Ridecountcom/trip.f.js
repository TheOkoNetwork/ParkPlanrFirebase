const functions = require('firebase-functions')
const admin = require('firebase-admin')

try {
  admin.initializeApp()
} catch (e) {
  console.log(e)
  //   yes this is meant to be empty
}
const db = admin.firestore()

const fetch = require('node-fetch')
const cheerio = require('cheerio')
const { v4: uuidv4 } = require('uuid')
const moment = require('moment')

const onRideCountComMigrationHandleTrip = functions.firestore
  .document('ridecountcomTrips/{migrationRequestId}')
  .onWrite(async (change, context) => {
    const requestData = change.after.data()
    requestData.id = context.params.migrationRequestId
    const correlationId = uuidv4()
    console.log(`Correlation ID: ${correlationId}`)
    console.log(requestData)
    const requestDocRef = db
      .collection('ridecountcomTrips')
      .doc(requestData.id)
    if (requestData.status !== 0) {
      console.log('status not 0')
      return null
    }
    const requestUrl = requestData.tripLink
    console.log(`Requesting url: ${requestUrl}`)
    const fetchResult = await fetch(requestUrl, {
      headers: {
        'User-Agent': 'parkplanr.app'
      },
      referrer: 'https://parkplanr.app',
      body: null,
      method: 'GET'
    })
    console.log('Got fetch result')
    const resultBody = await fetchResult.text()
    console.log('Got result body')
    const $ = cheerio.load(resultBody)
    const parkName = $(
      '#app > main > div.bg-brand-lightest > div > div > div > div.my-8 > div > div.flex.md\\:ml-5.items-center.mb-4.md\\:mb-0 > div > p'
    )
      .text()
      .trim()
    console.log(parkName)
    const attractionsJson = JSON.parse(
      $('trip-show-attraction-list').attr(':initial-attractions')
    )
    console.log(attractionsJson)
    const tripDate = moment(
      $('trip-show-attraction-list').attr(':visit-date'),
      'Do MMMM YYYY'
    )
    console.log(tripDate)

    const uniqueAttractions = {}
    const rides = []
    attractionsJson.forEach((attractionData) => {
      console.log(attractionData)
      uniqueAttractions[attractionData.id] = attractionData.name
      rides.push(attractionData)
    })
    console.log(uniqueAttractions)
    const uniqueAttractionDocPromises = []
    Object.keys(uniqueAttractions).forEach((attractionId) => {
      uniqueAttractionDocPromises.push(
        db
          .collectionGroup('rides')
          .where('ridecountcomAttractionId', 'array-contains', Number(attractionId))
          .get()
      )
    })
    const uniqueAttractionDocs = await Promise.all(uniqueAttractionDocPromises)
    const attractionsData = {}
    uniqueAttractionDocs.forEach((attractionDocs) => {
      let attractionId
      if (attractionDocs.empty) {
        attractionId = attractionDocs.query._queryOptions.fieldFilters[0].value
        console.log(
          `Attraction with ridecount.com ID: ${attractionId} not found`
        )
      } else {
        console.log('Attraction found')
        const attractionDoc = attractionDocs.docs[0]
        const attractionData = attractionDoc.data()
        attractionData.id = attractionDoc.id
        attractionData.parkId = attractionDoc.ref.path.split('/')[1]
        attractionsData[
          attractionData.ridecountcomAttractionId
        ] = attractionData
        console.log(attractionData)
      }
    })

    const obtainedAttractionCount = Object.keys(attractionsData).length
    const expectedAttractionCount = Object.keys(uniqueAttractions).length
    console.log(
      `Successfully obtained: ${obtainedAttractionCount} docs from firestore, out of expected: ${expectedAttractionCount}`
    )
    if (obtainedAttractionCount !== expectedAttractionCount) {
      console.log(
        'Obtained attraction count does not match expected attraction count'
      )
      console.log(
        'This means there is an attraction in ridecount.com data that does not exist in firestore'
      )
      console.log(`Correlation ID: ${correlationId}`)
      const missingAttractions = []
      const missingAttractionIds = []
      Object.keys(uniqueAttractions).forEach((attractionId) => {
        if (!attractionsData[attractionId]) {
          const uniqueAttractionName = uniqueAttractions[attractionId]
          const missingAttraction = {
            id: Number(attractionId),
            name: uniqueAttractionName
          }
          console.log(
            `Ridecount.com attraction ID: ${attractionId} name: ${uniqueAttractionName} does not exist in firestore, correlationId: ${correlationId}`
          )
          missingAttractions.push(missingAttraction)
          missingAttractionIds.push(missingAttraction.id)
        }
      })

      const batch = db.batch()
      const migrateRequestDocRef = db
        .collection('ridecountMigrationRequests')
        .doc(requestData.migrationRequestId)
      batch.set(
        migrateRequestDocRef,
        {
          failedTrips: admin.firestore.FieldValue.arrayUnion(requestData.id)
        },
        { merge: true }
      )
      batch.set(
        requestDocRef,
        {
          status: 98,
          statusReason: `Missing attractions from firestore: ${correlationId}`,
          missingAttractions: missingAttractions,
          missingAttractionIds: missingAttractionIds
        },
        { merge: true }
      )

      await batch.commit()
      console.log(`Flagged ridecount.com trip: ${requestData.id} as failed`)
      return null
    }

    const batches = []
    const batchPromises = []
    let currentBatch = 0
    batches[currentBatch] = db.batch()
    let currentBatchCount = 0
    const maxBatchCount = 250

    const tripDocs = {}

    Object.keys(attractionsData).forEach((attractionId) => {
      const attractionData = attractionsData[attractionId]
      tripDocs[attractionData.parkId] = db
        .collection('users')
        .doc(requestData.user)
        .collection('ridecount')
        .doc()
    })
    rides.forEach((ride) => {
      const rideCount = ride.pivot.count
      const attractionData = attractionsData[ride.id]
      const docRef = tripDocs[attractionData.parkId].collection('rides').doc()

      if (currentBatchCount >= maxBatchCount) {
        console.log('Creating new batch')
        currentBatch++
        batches[currentBatch] = db.batch()
        currentBatchCount = 0
      }

      batches[currentBatch].set(docRef, {
        count: rideCount,
        ride: attractionsData[ride.id].id,
        time: tripDate
      })
      currentBatchCount++
    })
    Object.keys(attractionsData).forEach((attractionId) => {
      if (currentBatchCount >= maxBatchCount) {
        console.log('Creating new batch')
        currentBatch++
        batches[currentBatch] = db.batch()
        currentBatchCount = 0
      }

      const attractionData = attractionsData[attractionId]
      console.log(attractionData)
      tripDocs[attractionData.parkId].set({
        date: tripDate,
        park: attractionData.parkId,
        totalRides: 0
      })
    })

    if (currentBatchCount >= maxBatchCount) {
      console.log('Creating new batch')
      currentBatch++
      batches[currentBatch] = db.batch()
      currentBatchCount = 0
    }
    batches[currentBatch].set(
      requestDocRef,
      {
        status: 200
      },
      { merge: true }
    )
    currentBatchCount++
    if (currentBatchCount >= maxBatchCount) {
      console.log('Creating new batch')
      currentBatch++
      batches[currentBatch] = db.batch()
      currentBatchCount = 0
    }
    const migrateRequestDocRef = db
      .collection('ridecountMigrationRequests')
      .doc(requestData.migrationRequestId)
    batches[currentBatch].set(
      migrateRequestDocRef,
      {
        processedTrips: admin.firestore.FieldValue.increment(1),
        unprocessedTrips: admin.firestore.FieldValue.increment(-1)
      },
      { merge: true }
    )
    currentBatchCount++

    batches.forEach((batch) => {
      batchPromises.push(batch.commit())
    })
    const batchResult = await Promise.all(batchPromises)
    const batchCount = batchResult.length
    console.log(`Comitted ${batchCount} batches`)
    return null
  })

exports = module.exports = onRideCountComMigrationHandleTrip
