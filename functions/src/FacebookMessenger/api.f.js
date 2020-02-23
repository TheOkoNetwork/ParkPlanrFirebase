const functions = require('firebase-functions')
const admin = require('firebase-admin')
try {
  admin.initializeApp()
} catch (e) {
  // yes this is meant to be empty
}

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')({ origin: true })
const app = express()
const slashes = require('connect-slashes')
const db = admin.firestore()
const verifyToken = functions.config().facebookmessengerwebhook.verifytoken

app.use(cors)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// Rewrite Firebase hosting requests: /api/:path => /:path
app.use((req, res, next) => {
  console.log(req.url)
  if (req.url.indexOf('/FacebookMessenger/') === 0) {
    req.url = req.url.substring('FacebookMessenger'.length + 1)
  }
  next()
})
app.use(slashes(false))

app.get('/webhook/', (req, res) => {
  // Parse the query params
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === verifyToken) {
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED')
      res.status(200).send(challenge)
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403)
    }
  }
})

app.post('/webhook/', (req, res) => {
  const body = req.body

  if (body.object === 'page') {
    var batch = db.batch()

    body.entry.forEach((entry) => {
      console.log(body)
      const webhookEvent = entry.messaging[0]
      console.log(webhookEvent)
      batch.set(db.collection('FacebookMessengerMessages').doc(), webhookEvent)
    })
    return batch.commit().then(() => {
      return res.status(200).send('EVENT_RECEIVED')
    })
  } else {
    return res.status(400).send(`UNKNOWN_SUBSCRIPTION_OBJECT_${body.object}`)
  }
})
exports = module.exports = functions.https.onRequest(app)
