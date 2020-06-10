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
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(functions.config().sendgrid.key)

app.use(cors)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Rewrite Firebase hosting requests: /api/:path => /:path
app.use((req, res, next) => {
  console.log(req.url)
  if (req.url.indexOf('/ChatbotApi/') === 0) {
    req.url = req.url.substring('ChatbotApi'.length + 1)
  }
  next()
})
app.use(slashes(false))

app.post('/passwordReset/', async (req, res) => {
  var bodyData = req.body
  console.log(bodyData)

  var userEmail

  var actionsData = {
    actions: []
  }

  if (bodyData.Memory) {
    var Memory = JSON.parse(bodyData.Memory)
    if (Memory.twilio.collected_data) {
      if (Memory.twilio.collected_data.userEmail) {
        userEmail = Memory.twilio.collected_data.userEmail.answers.userEmailAddress.answer
      }
    }
  }
  if (userEmail) {
    var passwordResetEmailInvalidCount = 0
    console.log(`Found user email: ${userEmail}, looking up user`)
    console.log(userEmail)
    try {
      var userAccount = await admin.auth().getUserByEmail(userEmail)
      console.log('User exists')
      console.log(userAccount)
      var passwordResetLink = await admin.auth().generatePasswordResetLink(userEmail)
      console.log(`Got password reset link: ${passwordResetLink}`)

      var emailData = {
        to: userEmail,
        from: 'support@parkplanr.app',
        templateId: 'd-2815cea91a5241b585f8a5e5695cd5fe',
        dynamic_template_data: {
          passwordResetUrl: passwordResetLink
        }
      }
      console.log('Sending email')
      console.log(emailData)
      var emailResult = await sgMail.send(emailData)
      console.log(emailResult)
      actionsData.actions.push({ say: `Please check your email account (${userEmail}), and follow the instructions in the email we just sent you to reset your password` })
      actionsData.actions.push({ say: 'Is there anything else we can do for you?' })
      res.status(200).json(actionsData)
      return
    } catch (error) {
      console.log('Error looking up user by email')
      console.log(error)
      console.log(passwordResetEmailInvalidCount)
      actionsData.actions.push({ remember: { passwordResetEmailInvalidCount: passwordResetEmailInvalidCount++ } })
      actionsData.actions.push({ say: "Sorry, we couldn't find an account with that email address, please try again" })
    }
  }

  actionsData.actions.push({
    collect: {
      name: 'userEmail',
      questions: [{
        question: 'What is your email address?',
        name: 'userEmailAddress',
        type: 'Twilio.EMAIL'
      }],
      on_complete: {
        redirect: 'task://passwordReset'
      }
    }
  })
  actionsData.actions.push({ say: 'Just a second whilst we find your account' })
  res.status(200).json(actionsData)
})
exports = module.exports = functions.https.onRequest(app)
