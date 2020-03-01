import { config } from './config.js'
import { stateUrl } from './stateUrl.js'
import { inboxMessageHeader, inboxMessageCount } from './inbox.js'

var firebase = require('firebase/app')
var Navigo = require('navigo')
require('firebase/auth')
require('firebase/firestore')

window.stateData = {}

const init = async () => {
  console.log(`I am running on version: ${config('version')}`)

  console.table(config())

  // fetch firebase configuration json
  const response = await window.fetch('/__/firebase/init.json')
  const firebaseConfig = await response.json()
  console.table(firebaseConfig)

  // initialize firebase
  firebase.initializeApp(firebaseConfig)
  window.db = firebase.firestore()
  $('body').trigger('dbLoaded')

  inboxMessageCount()

  $('#signoutButton').on('click', function () {
    signout()
  })

  // when a user signs in, out or is first seen this session in either state
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      $('.currentUsername').text(firebase.auth().currentUser.displayName)
      $('.userProfileImage').prop('src', firebase.auth().currentUser.photoURL)
      userAuthenticated(user)
    } else {
      console.log('User is unauthenticated')
      window.location = '/signin'
    }
  })
}

function userAuthenticated (user) {
  console.log(user)

  firebase.auth().currentUser.getIdTokenResult().then((idTokenResult) => {
    // Confirm the user is an Admin.
    if (idTokenResult.claims.admin) {
      console.log('I am an admin')
    } else {
      console.log('I am not an admin, i should not be here')
      window.location.href = `https://parkplanr.app/notTeamMember?uid=${user.uid}`
    }
  }).catch((error) => {
    console.log(error)
  })
}

function signout () {
  firebase.auth().signOut().then(function () {
    console.log('Signed out')
  }).catch(function (error) {
    console.log('Error signing out', error)
  })
}

function load404 () {
  // TODO: This but better
  $('#contentDiv').html('4 oh 4')
};

window.loadFragment = function (fragment) {
  console.log(`Loading fragment: ${fragment}`)
  $.get(`/fragments/${fragment}.html`, function (data) {
    try {
      var isFragment = data.startsWith('<!-- FRAGMENT CONTENT-TAG_ID -->')

      if (!isFragment) {
        console.log('Fragment HTML file not found')
        // load404();
        return
      };

      $(`.fragmentHolder[data-fragmentid="${fragment}"]`).each(function () {
        $(this).replaceWith(data)
      })
      router.updatePageLinks()

      var today = new Date()
      $('.currentYear').text(today.getFullYear())
      $('.currentVersion').text(config('version'))

      inboxMessageCount()

      switch (fragment) {
        case 'headerNav':
          inboxMessageHeader()
          break
      };
    } catch (error) {
      console.log(error)
      // bugsnagClient.notify(error);
      // showFatalErrorPage(error);
    };
  }).fail(function (error) {
    console.log('Failed loading fragment')
    // bugsnagClient.notify(error);
    console.log(error)
  })
}

function loadPage (page) {
  $.get(`/pages/${page}.html`, function (data) {
    try {
      var isPage = data.startsWith('<!-- PAGE CONTENT-TAG_ID -->')
      var isStandalonePage = data.startsWith('<!-- STANDALONE PAGE CONTENT-TAG_ID -->')
      if (!isPage && !isStandalonePage) {
        console.log('Page HTML file not found')
        load404()
        return
      };

      // loads the page content into the dom
      if (isPage) {
        //    if (!$('#contentDiv').length) {
        //      console.log('Switching from standalone page, loading standard page core layout')
        //      $('#body').html('<script id="header_Holder">LoadFragment("header");</script><main id="main"></main><script id="footer_Holder">LoadFragment("footer");</script>')
        //    };
        $('#contentDiv').html(data)
      } else {
        $('body').html(data)
      };
      router.updatePageLinks()
      inboxMessageCount()

      // updates any tags with the class CurrentYear with the YYYY year
      $('.CurrentYear').text(new Date().getFullYear())
      // scrolls back to the top of the window
      window.scrollTo(0, 0)
    } catch (error) {
      console.log(error)
      // showFatalErrorPage(error, 'PPERPGCA')
    };
  }).fail(function (error) {
    console.log(error)
    // showFatalErrorPage(error, 'PPERPGLD')
  })
}

console.log(stateUrl())

var root = `https://${window.location.href.split('/')[2]}/`
var useHash = false
var hash = '#!' // Defaults to: '#'
var router = new Navigo(root, useHash, hash)
window.router = router

router.on({
  'inbox/:id': function () {
    console.log('I am on a inbox conversation')
    loadPage('inbox/conversation')
  },
  inbox: function () {
    console.log('I am on the inbox main page')
    loadPage('inbox')
  },
  '/': function () {
    console.log('I am on the home page')
    loadPage('index')
  }
})

router.notFound(function () {
  console.log('Route not found')
  load404()
})

$(document).ready(function () {
  $('.defaultFragmentHolder').each(function () {
    var fragment = $(this).data('fragmentid')
    window.loadFragment(fragment)
  })

  router.resolve()
})

init()
