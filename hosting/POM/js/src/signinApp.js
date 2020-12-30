import { config } from './config.js'

const firebase = require('firebase/app')
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

  $('#signinWithEmailPasswordButton').on('click', function () {
    signinEmail()
  })

  $('#signinWithFacebookButton').on('click', function () {
    signinFacebook()
  })

  $('#signinWithGoogleButton').on('click', function () {
    signinGoogle()
  })

  $('#signinWithAppleButton').on('click', function () {
    signinApple()
  })

  firebase.auth().onAuthStateChanged(function (user) {
    console.log('Auth state changed')
    console.log(user)
    if (user) {
      console.log('Authenticated, redirecting to home')
      window.location.href = '/'
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

function signinEmail () {
  const email = $('#email').val()
  const password = $('#password').val()

  if (!email) {
    console.log('No email address provided')
    return
  }
  if (!password) {
    console.log('No password provided')
    return
  }

  console.log('Attempting to sign in with email address and password')

  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .catch(function (error) {
      console.log('Error signing in with email address and password')
      console.table(error)
    })
}

function signinFacebook () {
  const provider = new firebase.auth.FacebookAuthProvider()
  firebase.auth().signInWithRedirect(provider)
}
function signinGoogle () {
  const provider = new firebase.auth.GoogleAuthProvider()
  firebase.auth().signInWithRedirect(provider)
}

function signinApple () {
  const provider = new firebase.auth.OAuthProvider('apple.com')
  firebase.auth().signInWithRedirect(provider)
}

init()
