import { config } from './config.js'

var firebase = require('firebase/app')
require('firebase/auth')

const init = async () => {
  console.log(`I am running on version: ${config('version')}`)

  console.table(config())

  var today = new Date()
  $('.currentYear').text(today.getFullYear())
  $('.currentVersion').text(config('version'))

  // fetch firebase configuration json
  const response = await window.fetch('/__/firebase/init.json')
  const firebaseConfig = await response.json()
  console.table(firebaseConfig)

  // initialize firebase
  firebase.initializeApp(firebaseConfig)

  // when a user signs in, out or is first seen this session in either state
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      $('.currentUsername').text(firebase.auth().currentUser.displayName)
      $('.userProfileImage').prop('src', firebase.auth().currentUser.photoURL)
    } else {
      console.log('User is unauthenticated')
      window.location = '/signin'
    }
  })

  //  firebase.auth().currentUser.getIdTokenResult().then((idTokenResult) => {
  //     if (!parkplanr.appfirebase.auth().currentUser.getIdTokenResult() .then((idTokenResult) => { // Confirm the user is an Admin. if (!!idTokenResult.claims.admin) { console.log("I am an admin"); } else { console.log("I am not an admin, i should not be here"); window.location.href="https://parkplanr.app" } }) .catch((error) => { console.log(error); });f!idTokenResult.claims.admin) {
  //       console.log("I am an admin");
  //     } else {
  //       console.log("I am not an admin, i should not be here");
  //        window.location.href="https://parkplanr.app"
  //     }
  //  }).catch((error) => {
  //    console.log(error);
  //  });
}

init()
