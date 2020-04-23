/* global firebase, location, $ */

function signout () { // eslint-disable-line no-unused-vars
  firebase.auth().signOut()
};

firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    console.log('User is signed in')
    console.log(user)
  } else {
    console.log('User is unauthenticated')
    location.href = '/signin'
  }
})

function signinEmail () { // eslint-disable-line no-unused-vars
  var email = $('#input-email').val()
  var password = $('#input-password').val()

  if (firebase.auth().currentUser) {
    location.href = '/'
  };

  console.log(`Signing in with email: ${email}`)

  firebase.auth().signInWithEmailAndPassword(email, password).catch(function (error) {
    console.log('Error signing in with email and password')
    console.log(error)
    console.log(error.code)
    handleFirebaseAuthenticationError('signing in with email and password', error)
  })
};

function handleFirebaseAuthenticationError (actionText, error) {
  console.log({ actionText, error })
};
