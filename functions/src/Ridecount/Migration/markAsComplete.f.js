const functions = require('firebase-functions')
const admin = require('firebase-admin')

try {
  admin.initializeApp()
} catch (e) {
  // yes this is meant to be empty
}
const db = admin.firestore()
const { v4: uuidv4 } = require('uuid')

const OnRideCountMigrationMarkAsComplete = functions.firestore
  .document('ridecountMigrationRequests/{migrationRequestId}')
  .onWrite(async (change, context) => {
    const correlationId = uuidv4()
    console.log(`CorrelationId is: ${correlationId}`)
    const requestData = change.after.data()
    requestData.id = context.params.migrationRequestId
    console.log(requestData)
    const requestDocRef = db
      .collection('ridecountMigrationRequests')
      .doc(requestData.id)
    if (requestData.status !== 1) {
      console.log('status not 1')
      return
    }
    if (requestData.unprocessedTrips.length !== 0) {
      console.log('There are trips pending processing')
    } else {
      console.log('All trips processed, flagging as complete')
      await requestDocRef.set(
        {
          status: 200,
          inProgress: false
        },
        { merge: true }
      )
      console.log('Flagged migration request as complete')
    }
  })
exports = module.exports = OnRideCountMigrationMarkAsComplete
