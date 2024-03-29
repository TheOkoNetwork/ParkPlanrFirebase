import { config } from './config.js'
import { stateUrl } from './stateUrl.js'
import { ridecountHomeLoad, ridecountImportLoad } from './ridecount.js'
import { initHeaderParksDropdown } from './header.js'
const firebase = require('firebase/app').default
window.firebase = firebase
const Navigo = require('navigo')
require('firebase/auth')
require('firebase/firestore')
require('firebase/storage')
const $ = window.$
window.stateData = {}

function getCurrentUser () {
  return new Promise((resolve, reject) => {
    const unsubscribe = window.auth.onAuthStateChanged((user) => {
      unsubscribe()
      resolve(user)
    }, reject)
  })
}

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

  window.storage = firebase.storage()
  $('body').trigger('storageLoaded')

  window.auth = firebase.auth()
  $('body').trigger('authLoaded')

  // when a user signs in, out or is first seen this session in either state
  window.auth.onAuthStateChanged(function (user) {
    if (user) {
      $('.currentUsername').text(window.auth.currentUser.displayName)
      $('.userProfileImage').prop('src', window.auth.currentUser.photoURL)
      userAuthenticated(user)
      $('.showIfAuthenticated').show()
      $('.showIfUnauthenticated').hide()
    } else {
      console.log('User is unauthenticated')
      $('.showIfAuthenticated').hide()
      $('.showIfUnauthenticated').show()
    }
  })

  router.on({
    '/': function () {
      console.log('I am on the home page')
      loadPage('index')
    },
    '/signout': async function () {
      console.log('I am on the signout page')
      await getCurrentUser()
      console.log('Auth Loaded, sign in flow')
      const signoutSplit = window.location.hash.split('signout=')
      if (signoutSplit.length > 1) {
        console.log('Sign out flow complete')
        window.auth.signOut()
        window.router.navigate('/')
      } else {
        console.log('No post sign out flag, redirect to authcore')
        const service = window.location.hostname
        let authCoreUrl
        if (service === 'dev.parkplanr.app') {
          authCoreUrl = 'auth.dev.parkplanr.app'
        } else {
          authCoreUrl = 'auth.parkplanr.app'
        }
        console.log(`Detected auth core URL: ${authCoreUrl}`)
        const redirectUrl = `https://${authCoreUrl}/signout#service=${service}`
        console.log(`Got redirect url: ${redirectUrl}`)
        window.location.href = redirectUrl
      }
    },
    '/signin': async function () {
      console.log('I am on the sign in page')
      const tokenSplit = window.location.hash.split('token=')
      if (tokenSplit.length > 1) {
        console.log('Got auth token, attempt sign in with custom token')
        try {
          await firebase.auth().signInWithCustomToken(tokenSplit[1])
          console.log('Authenticated, redirecting to post auth url')
          const postAuthUrl = window.localStorage.postAuthUrl || '/'
          delete window.localStorage.postAuthUrl
          window.router.navigate(postAuthUrl)
        } catch (err) {
          console.log('Error signing in with custom token')
          console.log(err)
          window.location = '/signin'
        }
      } else {
        console.log('No token, redirect to authcore')
        const service = window.location.hostname
        let authCoreUrl
        if (service === 'dev.parkplanr.app') {
          authCoreUrl = 'auth.dev.parkplanr.app'
        } else {
          authCoreUrl = 'auth.parkplanr.app'
        }
        console.log(`Detected auth core URL: ${authCoreUrl}`)
        const redirectUrl = `https://${authCoreUrl}/signin#service=${service}`
        console.log(`Got redirect url: ${redirectUrl}`)
        window.location.href = redirectUrl
      }
    },
    '/ridecount': function () {
      console.log('I am on the ridecount page')
      loadPage('ridecount')
    },
    '/ridecount/import': function () {
      console.log('I am on the ridecount import page')
      loadPage('ridecount/import')
    }
  })

  router.notFound(function () {
    console.log('Route not found')
    load404()
  })

  $(document).ready(function () {
    $('.defaultFragmentHolder').each(function () {
      const fragment = $(this).data('fragmentid')
      window.loadFragment(fragment)
    })

    router.resolve()
  })
}

function userAuthenticated (user) {
  console.log(user)
}

function load404 () {
  // $('#contentDiv').html('4 oh 4')
  loadPage('404')
}

window.loadFragment = function (fragment) {
  console.log(`Loading fragment: ${fragment}`)
  $.get(`/fragments/${fragment}.html`, function (data) {
    try {
      const isFragment = data.startsWith('<!-- FRAGMENT CONTENT-TAG_ID -->')

      if (!isFragment) {
        console.log('Fragment HTML file not found')
        // load404();
        return
      }

      $(`.fragmentHolder[data-fragmentid="${fragment}"]`).each(function () {
        $(this).replaceWith(data)
      })
      router.updatePageLinks()

      const today = new Date()
      $('.currentYear').text(today.getFullYear())
      $('.currentVersion').text(config('version'))

      switch (fragment) {
        case 'header':
          $('#signOutButton').on('click', function () {
            window.router.navigate('/signout')
          })
          initHeaderParksDropdown()
          break
      }
    } catch (error) {
      console.log(error)
      // bugsnagClient.notify(error);
      // showFatalErrorPage(error);
    }
  }).fail(function (error) {
    console.log('Failed loading fragment')
    // bugsnagClient.notify(error);
    console.log(error)
  })
}

function loadPage (page, params) {
  $.get(`/pages/${page}.html`, function (data) {
    try {
      const isPage = data.startsWith('<!-- PAGE CONTENT-TAG_ID -->')
      const isStandalonePage = data.startsWith(
        '<!-- STANDALONE PAGE CONTENT-TAG_ID -->'
      )
      if (!isPage && !isStandalonePage) {
        console.log('Page HTML file not found')
        if (page === '404') {
          $('#contentDiv').html('4 oh 4')
        } else {
          loadPage('404', params)
        }
        return
      }

      // loads the page content into the dom
      if (isPage) {
        if (!$('#contentDiv').length) {
          console.log(
            'Switching from standalone page, loading standard page core layout'
          )
          $('#body').html(
            '<script id="header_Holder">LoadFragment("header");</script><main id="contentDiv"></main><script id="footer_Holder">LoadFragment("footer");</script>'
          )
        }
        $('#contentDiv').html(data)
      } else {
        $('body').html(data)
      }
      router.updatePageLinks()

      // updates any tags with the class CurrentYear with the YYYY year
      $('.currentYear').text(new Date().getFullYear())
      // scrolls back to the top of the window
      window.scrollTo(0, 0)

      if (window.auth.currentUser) {
        $('.currentUsername').text(window.auth.currentUser.displayName)
        $('.userProfileImage').prop('src', window.auth.currentUser.photoURL)
        userAuthenticated(window.auth.user)
        $('.showIfAuthenticated').show()
        $('.showIfUnauthenticated').hide()
      } else {
        console.log('User is unauthenticated')
        $('.showIfAuthenticated').hide()
        $('.showIfUnauthenticated').show()
      }

      switch (page) {
        case 'ridecount':
          ridecountHomeLoad(params)
          break
        case 'ridecount/import':
          ridecountImportLoad(params)
          break
      }
    } catch (error) {
      console.log(error)
      // showFatalErrorPage(error, 'PPERPGCA')
    }
  }).fail(function (error) {
    console.log(error)
    // showFatalErrorPage(error, 'PPERPGLD')
  })
}

console.log(stateUrl())

const root = `https://${window.location.href.split('/')[2]}/`
const useHash = false
const hash = '#!' // Defaults to: '#'
const router = new Navigo(root, useHash, hash)
window.router = router
init()
