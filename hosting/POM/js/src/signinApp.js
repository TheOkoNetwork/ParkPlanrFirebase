import { config } from './config.js'

const firebase = require('firebase/app').default
require('firebase/auth')

window.firebase = firebase

const init = async () => {
  console.log(`I am running on version: ${config('version')}`)

  console.table(config())

  const response = await window.fetch('/__/firebase/init.json')
  const firebaseConfig = await response.json()
  console.table(firebaseConfig)

  firebase.initializeApp(firebaseConfig)
  console.log(firebase.auth())

  console.log("I am on the signin page");

  console.log("Auth Loaded, sign in flow");
  var tokenSplit = window.location.hash.split("token=");
  if (tokenSplit.length > 1) {
    console.log("Got auth token, attempt sign in with custom token");
    try {
      firebase.auth().signInWithCustomToken(tokenSplit[1]);
    } catch (err) {
      console.log("Error signing in with custom token");
      console.log(err);
      window.location = "/signin";
    }
  } else {
    console.log("No token, redirect to authcore");
    var service = location.hostname;
    let authCoreUrl;
    console.log(redirectUrl);
    if (service == "pom.dev.parkplanr.app") {
      authCoreUrl = "auth.dev.parkplanr.app";
    } else {
      authCoreUrl = "auth.parkplanr.app";
    }
    console.log(`Detected auth core URL: ${authCoreUrl}`);
    var redirectUrl = `https://${authCoreUrl}/signin#service=${service}`;
    console.log(`Got redirect url: ${redirectUrl}`);
    location.href = redirectUrl;
  }


  firebase.auth().onAuthStateChanged(function (user) {
    console.log('Auth state changed')
    console.log(user)
    if (user) {
      console.log('Authenticated, redirecting to post auth url')
      const postAuthUrl = localStorage.postAuthUrl || "/";
      delete localStorage.postAuthUrl;
      window.location = (postAuthUrl);
    } else {
      console.log('Unauthenticated')
      getFirebaseRedirectResult()
    }
  })
}
function getFirebaseRedirectResult () {
  firebase
    .auth()
    .getRedirectResult()
    .then(function (result) {
      console.log('Got redirect result')
      console.log(result)
    })
    .catch(function (error) {
      console.log('Got redirect error')
      console.log(error)
      window.alert(error.message)
    })
}

init()
