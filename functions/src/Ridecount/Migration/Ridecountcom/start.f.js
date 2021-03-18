const functions = require('firebase-functions')
const admin = require('firebase-admin')

try {
  admin.initializeApp()
} catch (e) {
  // yes this is meant to be empty
}
const db = admin.firestore()
const fetch = require('node-fetch')
const cheerio = require('cheerio')
const { v4: uuidv4 } = require('uuid')

const OnRideCountComMigrationRequested = functions.firestore
  .document('ridecountMigrationRequests/{migrationRequestId}')
  .onWrite(async (change, context) => {
    const requestData = change.after.data()
    requestData.id = context.params.migrationRequestId
    console.log(requestData)
    const requestDocRef = db
      .collection('ridecountMigrationRequests')
      .doc(requestData.id)
    if (requestData.service !== 'ridecountcom') {
      console.log('Service is not ridecountcom')
      return
    }
    if (requestData.status !== 0) {
      console.log('status not 0')
      return
    }
    let pageNumber = 1
    let leftToProcess = true
    const links = []
    try {
      for (let i = 0; leftToProcess; i++) {
        const requestUrl = `https://ridecount.com/profiles/${requestData.ridecountcomUsername}?page=${pageNumber}`
        console.log(`Requesting url: ${requestUrl}`)
        // eslint-disable-next-line no-await-in-loop
        const fetchResult = await fetch(requestUrl, {
          headers: {
            'User-Agent': 'parkplanr.app'
          },
          referrer: 'https://parkplanr.app',
          body: null,
          method: 'GET'
        })
        console.log('Got fetch result')
        // eslint-disable-next-line no-await-in-loop
        const resultBody = await fetchResult.text()
        console.log('Got result body')
        const $ = cheerio.load(resultBody)

        $('a').each(function () {
          const link = $(this).attr('href')
          if (link.startsWith('https://ridecount.com/trips/')) {
            console.log('Ride count trip link')
            links.push(link)
          }
        })

        const nextLink = $('a:contains("Next »")').attr('href')
        if (nextLink) {
          console.log('There is another page to fetch')
          pageNumber++
        } else {
          console.log('Fetched all pages')
          leftToProcess = false
        }
      }
      console.log(links)

      const batches = []
      const batchPromises = []
      let currentBatch = 0
      batches[currentBatch] = db.batch()
      let currentBatchCount = 0
      const maxBatchCount = 250
      let tripCount = 0
      if (!links.length) {
        console.log('User has zero trips')
        await requestDocRef.set(
          {
            status: 200,
            statusReason:
              'Completed processing, user has 0 trips in ridecount.com profile',
            totalTrips: 0,
            unprocessedTrips: 0,
            processedTrips: 0,
            failedTrips: 0
          },
          { merge: true }
        )
        return
      }
      links.forEach(function (link) {
        if (currentBatchCount >= maxBatchCount) {
          console.log('Creating new batch')
          currentBatch++
          batches[currentBatch] = db.batch()
          currentBatchCount = 0
        }
        const docRef = db.collection('ridecountcomTrips').doc()
        const tripData = {
          migrationRequestId: requestData.id,
          user: requestData.user,
          tripLink: link,
          status: 0
        }
        batches[currentBatch].set(docRef, tripData)
        currentBatchCount++
        tripCount++
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
          status: 1,
          totalTrips: tripCount,
          unprocessedTrips: tripCount,
          processedTrips: 0,
          failedTrips: 0
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
      return
    } catch (err) {
      const correlationId = uuidv4()
      console.log(`Error either fetching trips or commiting: ${correlationId}`)
      console.log(err)
      // todo ping an alert on POM for any status 99
      await requestDocRef.set(
        {
          status: 99,
          statusReason: `Error fetching trips or committing: ${correlationId}`
        },
        { merge: true }
      )
      console.log('Flagged as failed')
    }
  })
exports = module.exports = OnRideCountComMigrationRequested
