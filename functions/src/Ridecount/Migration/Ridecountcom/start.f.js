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

function sleep (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const OnRideCountComMigrationRequested = functions
  .runWith({ timeoutSeconds: 300 })
  .firestore.document('ridecountMigrationRequests/{migrationRequestId}')
  .onCreate(async (doc, context) => {
    const requestData = doc.data()
    requestData.id = context.params.migrationRequestId

    const correlationId = uuidv4()
    console.log(requestData)
    console.log(`correlationId: ${correlationId}`)
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
    console.log(requestData)

    // todo flag as a in progress status code
    const requestUrl = `https://ridecount.com/profiles/${requestData.ridecountcomUsername}`
    const pageCountFetchRes = await fetch(requestUrl)
    const pageCountBody = await pageCountFetchRes.text()
    const pageCount$ = cheerio.load(pageCountBody)
    let highestPage = 0
    pageCount$('a').each(function () {
      const link = pageCount$(this).attr('href')
      if (
        link.startsWith(
          `https://ridecount.com/profiles/${requestData.ridecountcomUsername}?page=`
        )
      ) {
        const pageNumber = Number(link.split('=')[1])
        if (pageNumber > highestPage) {
          highestPage = pageNumber
        }
      }
    })
    console.log(`Highest page is: ${highestPage}`)
    if (highestPage === 0) {
      console.log('No trips for user')
    }

    const pageFetchPromises = []
    let pagesSinceSleep = 10
    const processedPages = []
    for (let page = 1; page <= highestPage; page++) {
      console.log(`fetching page: ${page}`)
      pageFetchPromises.push(
        fetch(
          `https://ridecount.com/profiles/${requestData.ridecountcomUsername}?page=${page}`
        )
      )
      processedPages.push(page)
      pagesSinceSleep--
      console.log(`${pagesSinceSleep} left to process before sleeping`)
      if (!pagesSinceSleep) {
        console.log('Need to sleep for a sec or two')
        // eslint-disable-next-line no-await-in-loop
        await sleep(2500)
        pagesSinceSleep = 10
      }
    }
    console.log('Waiting for all page fetch promises to complete')
    const pageFetchResults = await Promise.all(pageFetchPromises)
    console.log('Got all page promises')
    const pageBodyPromises = []
    console.log('Getting page bodies')
    pageFetchResults.forEach((pageFetchResult) => {
      pageBodyPromises.push(pageFetchResult.text())
    })
    const pageBodies = await Promise.all(pageBodyPromises)
    console.log('Got page bodies')
    // console.log(pageBodies);

    const links = []
    pageBodies.forEach((pageBody) => {
      const pageBody$ = cheerio.load(pageBody)
      pageBody$('a').each(function () {
        const link = pageBody$(this).attr('href')
        if (link.startsWith('https://ridecount.com/trips/')) {
          links.push(link)
        }
      })
    })
    // deduplicate any duplicates
    const deduplicatedLinks = [...new Set(links)]
    console.log(`Got all links length: ${links.length}`)
    console.log(`Got deduplicated links length: ${deduplicatedLinks.length}`)

    const batches = []
    const batchPromises = []
    let currentBatch = 0
    batches[currentBatch] = db.batch()
    let currentBatchCount = 0
    const maxBatchCount = 250

    const tripDocIds = []
    deduplicatedLinks.forEach((link) => {
      if (currentBatchCount >= maxBatchCount) {
        console.log('Creating new batch')
        currentBatch++
        batches[currentBatch] = db.batch()
        currentBatchCount = 0
      }
      const docRef = db.collection('ridecountcomTrips').doc()
      tripDocIds.push(docRef.id)
      batches[currentBatch].set(docRef, {
        created: admin.firestore.FieldValue.serverTimestamp(),
        requested: admin.firestore.FieldValue.serverTimestamp(),
        migrationRequestId: requestData.id,
        status: 0,
        tripLink: link,
        user: requestData.user,
        correlationIds: [correlationId]
      })
      currentBatchCount++
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
        failedTrips: [],
        processedTrips: [],
        totalTrips: deduplicatedLinks.length,
        unprocessedTrips: tripDocIds,
        inProgress: true,
        status: 1,
        correlationIds: [correlationId],
        processedPages: processedPages
      },
      { merge: true }
    )

    batches.forEach((batch) => {
      batchPromises.push(batch.commit())
    })
    const batchResult = await Promise.all(batchPromises)
    const batchCount = batchResult.length
    console.log(`Comitted ${batchCount} park batches`)
  })
exports = module.exports = OnRideCountComMigrationRequested
