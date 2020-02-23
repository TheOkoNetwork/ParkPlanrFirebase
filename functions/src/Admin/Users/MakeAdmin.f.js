const functions = require('firebase-functions')
const admin = require('firebase-admin')
try {
  admin.initializeApp()
} catch (e) {
  // yes this is meant to be empty
}

const MakeAdmin = functions.https.onRequest((request, response) => {
  var uid

  uid = 'aCQ1HTs57yflWgfgh8RHE3lyM7w2' // Gregory
  uid = 'igijrjp6IpZLf7FuzedzzZacTSC3' // Steve

  return response.send(admin.auth().setCustomUserClaims(uid, { Admin: true }).then(() => {
    return response.send('Made admin')
  }))
})

exports = module.exports = MakeAdmin
