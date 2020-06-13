const functions = require('firebase-functions')
const admin = require('firebase-admin')
try {
  admin.initializeApp()
} catch (e) {
  // yes this is meant to be empty
}

var ogs = require('open-graph-scraper')
const { uuid } = require('uuidv4')
const cors = require('cors')({ origin: true })

const LinkFetch = functions.https.onRequest((request, response) => {
  var outputResult
  var SiteHostname
  var CorrellationID
  var result
  var linkUrl

  cors(request, response, () => {
    var options = { url: request.query.url }
    return ogs(options).then((result) => {
      console.log('result:', result)
      outputResult = {
        success: 1,
        meta: {
          title: result.data.ogTitle,
          description: result.data.description,
          caption: result.data.ogSiteName,
          image: {
            url: result.data.ogImage.url
          },
          OGRaw: result.data
        }
      }
      if (result.data.ogUrl) {
        linkUrl = result.data.ogUrl
      } else {
        linkUrl = result.requestUrl
      };
      SiteHostname = linkUrl.split('/')[2]
      switch (SiteHostname) {
        case 'twitter.com':
          console.log('Twitter')
          outputResult.meta.title = `${result.data.ogDescription}`
          outputResult.meta.caption = `${result.data.ogTitle}`
          break
        default:
          console.log(`Unknown site hostname: ${SiteHostname}`)
      }
      return response.send(outputResult)
    }).catch((error) => {
      CorrellationID = uuid()
      console.log('error:', error)
      console.log(`Error correllation ID: ${CorrellationID}`)
      console.log(options)
      result = {
        success: 0,
        errorCode: 'PPERCMSLNKFCA',
        CorrellationID: CorrellationID
      }
      return response.send(result)
    })
  })
})

exports = module.exports = LinkFetch
