import { config } from './config.js'

var firebase = require('firebase/app')
require('firebase/auth')

const init = async () => {
  console.log(`I am running on version: ${config('version')}`)
  const response = await window.fetch('/__/firebase/init.json')
  const firebaseConfig = await response.json()
  console.table(firebaseConfig)

  firebase.initializeApp(firebaseConfig)
  console.log(firebase.auth())

  $('#signinWithEmailPasswordButton').on('click', function () {
    signinEmail()
  })
}

function signinEmail () {
  var email = $('#email').val()
  var password = $('#password').val()

  if (!email) {
    console.log('No email address provided')
    return
  };
  if (!password) {
    console.log('No password provided')
    return
  };

  console.log('Attempting to sign in with email address and password')
};

init()
