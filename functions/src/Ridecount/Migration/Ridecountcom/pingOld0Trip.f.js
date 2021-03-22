const functions = require('firebase-functions')
const admin = require('firebase-admin')

try {
  admin.initializeApp()
} catch (e) {
  console.log(e)
  //   yes this is meant to be empty
}
const db = admin.firestore()

const { v4: uuidv4 } = require('uuid')

const ping99Trip = functions.pubsub
  .schedule('* * * * *')
  .onRun(async (context) => {
    const correlationId = uuidv4()
    console.log(`Correlation ID: ${correlationId}`)

    const tsToMillis = admin.firestore.Timestamp.now().toMillis()
    const compareDate = new Date(tsToMillis - (2 * 60 * 1000))

    const tripDocs = await db
      .collection('ridecountcomTrips')
      .where('status', '==', 0)
      .where('requested', '<', compareDate)
      .get()
    if (tripDocs.empty) {
      console.log('No old trips in status 0')
      return null
    }
    const batches = []
    const batchPromises = []
    let currentBatch = 0
    batches[currentBatch] = db.batch()
    let currentBatchCount = 0
    const maxBatchCount = 250
    tripDocs.forEach((tripDoc) => {
      if (currentBatchCount >= maxBatchCount) {
        console.log('Creating new batch')
        currentBatch++
        batches[currentBatch] = db.batch()
        currentBatchCount = 0
      }
      batches[currentBatch].set(tripDoc.ref, {
        status: 0,
        statusReason: 'Pinged by ping old 0 trip function',
        correlationIds: admin.firestore.FieldValue.arrayUnion(correlationId),
        requested: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true })
      currentBatchCount++
    })
    batches.forEach((batch) => {
      batchPromises.push(batch.commit())
    })
    const batchResult = await Promise.all(batchPromises)
    const batchCount = batchResult.length
    console.log(`Comitted ${batchCount} park batches`)
    return null
  })

exports = module.exports = ping99Trip
