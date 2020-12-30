const Template7 = require('template7').default
const moment = require('moment')

const inboxMessagePage = async function () {
  if (!window.db) {
    console.log('DB not ready yet, unable to load inbox messages')
    $('body').on('dbLoaded', function () {
      console.log('DB Loaded, loading message header')
      inboxMessagePage()
    })
    return
  }

  $('.inboxRefreshButton').each(function () {
    $(this).off('click')
    $(this).on('click', function () {
      console.log('Refreshing messages')
      inboxMessagePage()
    })
  })

  $('.inboxTrashButton').each(function () {
    $(this).off('click')
    $(this).on('click', function () {
      console.log('Loading trash confirmation prompt')
      //    inboxMessagePage()
    })
  })

  console.log('Loading inbox messages')
  const inboxMessages = await window.db
    .collection('inbox')
    .where('open', '==', true)
    .where('folder', '==', 'INBOX')
    .get()

  const templateInboxMessage = Template7.compile(
    $('#templateInboxMessage').html()
  )

  $('#templateInboxMessage').empty()
  inboxMessages.forEach(function (inboxMessage) {
    console.log(inboxMessage)

    const data = inboxMessage.data()
    data.id = inboxMessage.id
    data.lastMessageReceivedAgo = moment(
      data.lastMessageReceived.toDate()
    ).fromNow()

    $('#inboxMessagesTbody').append(templateInboxMessage(data))
  })
  window.router.updatePageLinks()
}

const inboxMessageHeader = function () {
  if (!window.db) {
    console.log('DB not ready yet, unable to load inbox messages header')
    $('body').on('dbLoaded', function () {
      console.log('DB Loaded, loading message header')
      inboxMessageHeader()
    })
    return
  }

  window.db
    .collection('inbox')
    .where('open', '==', true)
    .orderBy('lastMessageReceived', 'desc')
    .onSnapshot(function (inboxMessages) {
      const templateHeaderNavInboxMessage = Template7.compile(
        $('#templateHeaderNavInboxMessage').html()
      )
      $('#headerNavInboxMessagesDiv').empty()
      inboxMessages.forEach(function (inboxMessageConversation) {
        console.log(inboxMessageConversation)
        const data = inboxMessageConversation.data()
        data.id = inboxMessageConversation.id
        data.lastMessageReceivedAgo = moment(
          data.lastMessageReceived.toDate()
        ).fromNow()
        $('#headerNavInboxMessagesDiv').html(
          templateHeaderNavInboxMessage(data)
        )
      })
      window.router.updatePageLinks()
    })
}

const inboxMessageCount = function () {
  if (!window.db) {
    console.log('DB not ready yet')
    return
  }

  if (typeof window.stateData.inboxMessageCount === 'number') {
    $('.inboxUnreadMessageCount').text(
      window.stateData.inboxUnreadMessageCount
    )
    $('.inboxMessageCount').text(window.stateData.inboxMessageCount)
    if (window.stateData.inboxUnreadMessageCount) {
      $('.inboxUnreadMessageCount')
        .show()
        .text(window.stateData.inboxUnreadMessageCount)
    } else {
      $('.inboxUnreadMessageCount').hide()
    }
  } else {
    console.log('inboxMessageCount Listener firing')
    window.stateData.inboxMessageCount = 0
    window.stateData.inboxUnreadMessageCount = 0
    window.db
      .collection('inbox')
      .where('open', '==', true)
      .onSnapshot(function (inboxMessages) {
        const messageCount = inboxMessages.docs.length
        window.stateData.inboxMessageCount = messageCount

        window.stateData.inboxUnreadMessageCount = 0
        inboxMessages.forEach(
          function (inboxMessage) {
            console.log(inboxMessage.data())
            if (!inboxMessage.data().read) {
              window.stateData.inboxUnreadMessageCount += 1
            }
          },
          function (error) {
            console.log('Error in inbox Message Count listener')
            console.log(error)
          }
        )

        inboxMessageCount()
      })
  }
}

export { inboxMessageCount, inboxMessageHeader, inboxMessagePage }
