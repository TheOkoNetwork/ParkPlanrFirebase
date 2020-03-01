const functions = require('firebase-functions')
const admin = require('firebase-admin')

try {
  admin.initializeApp()
} catch (e) {
  // yes this is meant to be empty
}
const db = admin.firestore()
const FBMessengerPageToken = functions.config().facebookmessengerwebhook.pagetoken
const FBMessenger = require('fb-messenger')
const messenger = new FBMessenger({ token: FBMessengerPageToken })

const OnMessageReceived = functions.firestore.document('facebookMessengerMessages/{docId}').onCreate(async (snapshot, context) => {
  var message = snapshot.data()
  var PSID = message.sender.id
  var firstName = ''
  var lastName = ''
  var profileImage = false
  var messageSendResult
  var AutoReplyMessageText
  var existingOpenConversation
  var PSIDUserPrivateQuery
  var userFID = false
  var conversationDoc
  var conversationMessageDoc

  var messengerProfile = await messenger.getProfile({ id: PSID })

  if (messengerProfile) {
    firstName = `${messengerProfile.first_name}`
    lastName = `${messengerProfile.last_name}`
    profileImage = `${messengerProfile.profile_pic}`
  }

  existingOpenConversation = await db.collection('inbox').where('platform.id', '==', 'FACEBOOK_MESSENGER').where('platform.PSID', '==', PSID).where('open', '==', true).get()
  if (existingOpenConversation.empty) {
    console.log(`No existing conversation found for PSID: ${PSID}, creating conversation`)

    PSIDUserPrivateQuery = await db.collectionGroup('private').where('facebookMessengerPSID', '==', PSID).limit(1).get()

    if (PSIDUserPrivateQuery.empty) {
      AutoReplyMessageText = `Thank's ${firstName} for your message, a member of the team will reply shortly.\n` +
'If you need assistance with your account could you please provide your user ID\n' +
'this is shown in the my user section of the website and the app'
    } else {
      userFID = PSIDUserPrivateQuery.docs[0].ref.path.split('/')[1]
      AutoReplyMessageText = `Thank's ${firstName} for your message, a member of the team will reply shortly.\n(FID: ${userFID})`
    }

    conversationDoc = db.collection('inbox').doc()
    await conversationDoc.set({
      platform: {
        id: 'FACEBOOK_MESSENGER',
        PSID: PSID,
        firstMessageId: message.message.mid,
        messengerProfile: messengerProfile
      },
      created: admin.firestore.FieldValue.serverTimestamp(),
      open: true,
      read: false,
      userFID: userFID,
      firstName: firstName,
      lastName: lastName,
      profileImage: profileImage,
      lastMessageText: message.message.text,
      lastMessageReceived: admin.firestore.FieldValue.serverTimestamp(),
      subject: message.message.text,
      folder: 'INBOX'
    })

    conversationMessageDoc = db.collection('inbox').doc(conversationDoc.id).collection('messages').doc()
    await conversationMessageDoc.set({
      platform: {
        messageID: message.message.mid,
        rawBody: message
      },
      type: 'TEXT',
      text: message.message.text,
      received: admin.firestore.FieldValue.serverTimestamp(),
      userFID: userFID
    })

    messageSendResult = await messenger.sendTextMessage({ id: PSID, text: AutoReplyMessageText })
    console.log(messageSendResult)

    await db.collection('facebookMessengerMessages').doc(context.params.docId).delete()
  } else {
    conversationDoc = existingOpenConversation.docs[0]

    await conversationDoc.ref.set({
      read: false,
      lastMessageText: message.message.text,
      lastMessageReceived: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true })

    conversationMessageDoc = db.collection('inbox').doc(conversationDoc.id).collection('messages').doc()
    await conversationMessageDoc.set({
      platform: {
        messageID: message.message.mid,
        rawBody: message
      },
      type: 'TEXT',
      text: message.message.text,
      received: admin.firestore.FieldValue.serverTimestamp(),
      userFID: userFID
    })

    console.log(`Existing conversation found for PSID: ${PSID}, marking read`)
    messageSendResult = await messenger.sendAction({ id: PSID, action: 'mark_seen' })
    console.log(messageSendResult)

    await db.collection('facebookMessengerMessages').doc(context.params.docId).delete()
  }
})
exports = module.exports = OnMessageReceived
