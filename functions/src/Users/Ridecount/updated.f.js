const functions = require('firebase-functions')
const admin = require('firebase-admin')

try {
  admin.initializeApp()
} catch (e) {
  // yes this is meant to be empty
}
const db = admin.firestore()

const OnRideCountAddEditOrDelete = functions.firestore.document('users/{uID}/ridecount/{tripId}/rides/{countId}').onWrite((change, context) => {
  let beforeCount
  let afterCount
  let countValue
  let count

  if (change.before.exists) {
    console.log('Existing count doc')
    if (change.after.exists) {
      console.log('Doc updated')
      beforeCount = change.before.data().count
      afterCount = change.after.data().count - beforeCount
      countValue = admin.firestore.FieldValue.increment(afterCount)
    } else {
      console.log('Doc deleted')
      count = 0 - change.before.data().count
      countValue = admin.firestore.FieldValue.increment(count)
    }
  } else {
    console.log('New count doc')
    count = change.after.data().count
    countValue = admin.firestore.FieldValue.increment(count)
  }
  console.log(`Incrementing count: ${count}`)
  return db.collection('Users').doc(context.params.UID).collection('ridecount').doc(context.params.tripId).update({
    totalRides: countValue
  }).then((result) => {
    return console.log('Updated ride count Total Rides')
  }).catch((error) => {
    console.log('Error Updating ride count Total Rides')
    return console.log(error)
  })
})
exports = module.exports = OnRideCountAddEditOrDelete
