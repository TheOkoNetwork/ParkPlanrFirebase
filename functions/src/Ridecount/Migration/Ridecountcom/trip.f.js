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
    try {
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
            .where(
              'ridecountcomAttractionId',
              'array-contains',
              Number(attractionId)
            )
            .get()
        )
      })
      const uniqueAttractionDocs = await Promise.all(
        uniqueAttractionDocPromises
      )
      const attractionsData = {}
      uniqueAttractionDocs.forEach((attractionDocs) => {
        let attractionId
        if (attractionDocs.empty) {
          attractionId =
            attractionDocs.query._queryOptions.fieldFilters[0].value
          console.log(
            `Attraction with ridecount.com ID: ${attractionId} not found`
          )
        } else {
          console.log('Attraction found')
          const attractionDoc = attractionDocs.docs[0]
          const attractionData = attractionDoc.data()
          attractionData.id = attractionDoc.id
          attractionData.parkId = attractionDoc.ref.path.split('/')[1]
          attractionData.ridecountcomAttractionId.forEach((attractionId) => {
            attractionsData[attractionId] = attractionData
          })
          console.log(attractionData)
        }
      })

      const missingAttractionsCount = Object.keys(uniqueAttractions).filter(
        (el) => {
          return Object.keys(attractionsData).indexOf(el) < 0
        }
      ).length
      if (missingAttractionsCount) {
        console.log(
          'There is an attraction in ridecount.com data that does not exist in firestore'
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
            missingAttractionIds: missingAttractionIds,
            tripParkName: parkName
          },
          { merge: true }
        )

        await batch.commit()
        console.log(`Flagged ridecount.com trip: ${requestData.id} as failed`)
        return null
      }

      const parkBatches = []
      const parkBatchPromises = []
      let currentParkBatch = 0
      parkBatches[currentParkBatch] = db.batch()
      let currentParkBatchCount = 0
      const maxParkBatchCount = 250

      const rideBatches = []
      const rideBatchPromises = []
      let currentRideBatch = 0
      rideBatches[currentRideBatch] = db.batch()
      let currentRideBatchCount = 0
      const maxRideBatchCount = 250

      const tripDocs = {}
      const uniqueParks = {}
      Object.keys(uniqueAttractions).forEach((attractionId) => {
        const attractionData = attractionsData[attractionId]
        const docRef = db
          .collection('users')
          .doc(requestData.user)
          .collection('ridecount')
          .doc()
        tripDocs[attractionData.parkId] = docRef
        uniqueParks[attractionData.parkId] = docRef
      })
      Object.keys(uniqueParks).forEach((parkId) => {
        if (currentParkBatchCount >= maxParkBatchCount) {
          console.log('Creating new batch')
          currentParkBatch++
          parkBatches[currentParkBatch] = db.batch()
          currentParkBatchCount = 0
        }

        parkBatches[currentParkBatch].set(uniqueParks[parkId], {
          date: tripDate,
          park: parkId,
          totalRides: 0,
          migrationService: 'ridecountcom',
          migrationTripLink: requestUrl
        })
        currentParkBatchCount++
      })

      rides.forEach((ride) => {
        const rideCount = ride.pivot.count
        const attractionData = attractionsData[ride.id]
        const docRef = tripDocs[attractionData.parkId]
          .collection('rides')
          .doc()

        if (currentRideBatchCount >= maxRideBatchCount) {
          console.log('Creating new batch')
          currentRideBatch++
          rideBatches[currentRideBatch] = db.batch()
          currentRideBatchCount = 0
        }

        rideBatches[currentRideBatch].set(docRef, {
          count: rideCount,
          ride: attractionsData[ride.id].id,
          time: tripDate
        })
        currentRideBatchCount++
      })

      if (currentRideBatchCount >= maxRideBatchCount) {
        console.log('Creating new batch')
        currentRideBatch++
        rideBatches[currentRideBatch] = db.batch()
        currentRideBatchCount = 0
      }
      const migrateRequestDocRef = db
        .collection('ridecountMigrationRequests')
        .doc(requestData.migrationRequestId)
      rideBatches[currentRideBatch].set(
        migrateRequestDocRef,
        {
          processedTrips: admin.firestore.FieldValue.arrayUnion(requestData.id),
          unprocessedTrips: admin.firestore.FieldValue.arrayRemove(
            requestData.id
          )
        },
        { merge: true }
      )
      currentRideBatchCount++

      // sanity check (race condition?)
      const currentDocStatus0Doc = await requestDocRef.get()
      if (currentDocStatus0Doc.data().status !== 0) {
        console.log('This document has already been processed')
        return null
      }
      console.log('Flagging as status 10')
      await requestDocRef.set(
        {
          status: 10
        },
        { merge: true }
      )

      // final sanity check (race condition?)
      const currentDocStatus10Doc = await requestDocRef.get()
      if (currentDocStatus10Doc.data().status !== 10) {
        console.log('This document has already been processed')
        return null
      }
      console.log('Comitting parks')
      parkBatches.forEach((batch) => {
        parkBatchPromises.push(batch.commit())
      })
      const parkBatchResult = await Promise.all(parkBatchPromises)
      const parkBatchCount = parkBatchResult.length
      console.log(`Comitted ${parkBatchCount} park batches`)

      console.log('Comitting rides')
      rideBatches.forEach((batch) => {
        rideBatchPromises.push(batch.commit())
      })
      const rideBatchResult = await Promise.all(rideBatchPromises)
      const rideBatchCount = rideBatchResult.length
      console.log(`Comitted ${rideBatchCount} park batches`)

      console.log('Flagging as status 200 (complete)')
      await requestDocRef.set(
        {
          status: 200
        },
        { merge: true }
      )
      console.log('Flagged as complete')
      return null
    } catch (error) {
      console.log('Got error')
      console.log(`Correlation ID: ${correlationId}`)
      console.log(error)
      await requestDocRef.set(
        {
          status: 99,
          statusReason: `Got error: ${correlationId}`
        },
        { merge: true }
      )
      console.log('Flagged as error 99')
      return null
    }
  })

exports = module.exports = onRideCountComMigrationHandleTrip
