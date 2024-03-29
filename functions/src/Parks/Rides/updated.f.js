const functions = require('firebase-functions')
const admin = require('firebase-admin')

try {
  admin.initializeApp()
} catch (e) {
  // yes this is meant to be empty
}
const db = admin.firestore()
const onAddRidecountComIdAdd = functions.firestore
  .document('parks/{parkId}/rides/{rideId}')
  .onWrite(async (change, context) => {
    const rideData = change.after.data()
    rideData.id = context.params.rideId

    if (rideData.ridecountcomAttractionId) {
      console.log('Has ridecount.com attraction ID')
      const docs = await db
        .collection('ridecountcomTrips')
        .where('missingAttractionIds', 'array-contains-any', rideData.ridecountcomAttractionId)
        .where('status', '==', 98)
        .get()
      if (docs.empty) {
        console.log('No ridecount.com trips missing this attraction ID')
      } else {
        console.log('Found trips missing this attraction ID')
        const batches = []
        const batchPromises = []
        let currentBatch = 0
        batches[currentBatch] = db.batch()
        let currentBatchCount = 0
        const maxBatchCount = 250

        docs.docs.forEach((doc) => {
          if (currentBatchCount >= maxBatchCount) {
            console.log('Creating new batch')
            currentBatch++
            batches[currentBatch] = db.batch()
            currentBatchCount = 0
          }
          const tripDocRef = db.collection('ridecountcomTrips').doc(doc.id)
          batches[currentBatch].set(tripDocRef, {
            status: 0,
            missingAttractionIds: [],
            missingAttractions: []
          }, { merge: true })
          currentBatchCount++

          if (currentBatchCount >= maxBatchCount) {
            console.log('Creating new batch')
            currentBatch++
            batches[currentBatch] = db.batch()
            currentBatchCount = 0
          }
          const requestDocRef = db.collection('ridecountMigrationRequests').doc(doc.data().migrationRequestId)
          batches[currentBatch].set(requestDocRef, {
            failedTrips: admin.firestore.FieldValue.arrayRemove(doc.id)
          }, { merge: true })
          currentBatchCount++
        })
        batches.forEach((batch) => {
          batchPromises.push(batch.commit())
        })
        const batchResult = await Promise.all(batchPromises)
        const batchCount = batchResult.length
        console.log(`Comitted ${batchCount} batches`)
      }
    } else {
      console.log('No ridecount.com attraction ID')
    }
  })
exports = module.exports = onAddRidecountComIdAdd
