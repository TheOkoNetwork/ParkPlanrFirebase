import { config } from './config.js'
import { stateUrl } from './stateUrl.js'

var firebase = require('firebase/app')
require('firebase/auth')

const init = async () => {
  console.log(`I am running on version: ${config('version')}`)

  console.table(config())

  // fetch firebase configuration json
  const response = await window.fetch('/__/firebase/init.json')
  const firebaseConfig = await response.json()
  console.table(firebaseConfig)

  // initialize firebase
  firebase.initializeApp(firebaseConfig)

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

window.loadFragment = function (fragment) {
  console.log(`Loading fragment: ${fragment}`)
  $.get(`/fragments/${fragment}.html`, function (data) {
    try {
      var isFragment = data.startsWith('<!-- FRAGMENT CONTENT-TAG_ID -->')

      if (!isFragment) {
        console.log('Fragment HTML file not found')
        // Load404();
        return
      };

      $(`.fragmentHolder[data-fragmentid="${fragment}"]`).each(function () {
        $(this).replaceWith(data)
      })

      var today = new Date()
      $('.currentYear').text(today.getFullYear())
      $('.currentVersion').text(config('version'))
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

$(document).ready(function () {
  $('.defaultFragmentHolder').each(function () {
    var fragment = $(this).data('fragmentid')
    window.loadFragment(fragment)
  })

  console.log(stateUrl())
})

init()
