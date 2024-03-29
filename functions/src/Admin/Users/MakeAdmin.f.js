const functions = require('firebase-functions')
const admin = require('firebase-admin')
try {
  admin.initializeApp()
} catch (e) {
  // yes this is meant to be empty
}

const MakeAdmin = functions.https.onRequest(async (request, response) => {
  let uidListString

  const uids = [
    'aCQ1HTs57yflWgfgh8RHE3lyM7w2', // Gregory
    'G5urWzoptvOiy5OdRLDUCwOlPt23', // Gregory FB
    'igijrjp6IpZLf7FuzedzzZacTSC3', // Steve
    'wp4yJpzzrrdmAnbdBla3BImX7tJ2' // Alex
  ]

  const uidSetClaimPromises = []
  uidListString = ''

  uids.forEach((uid) => {
    uidSetClaimPromises.push(
      admin.auth().setCustomUserClaims(uid, { admin: true })
    )
    uidListString += ` ${uid}`
  })

  await Promise.all(uidSetClaimPromises)
  response.send(`Made ${uidListString} admin`)
})

exports = module.exports = MakeAdmin
