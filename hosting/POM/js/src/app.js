import { config } from './config.js'
import { stateUrl } from './stateUrl.js'
import {
  inboxMessagePage,
  inboxMessageHeader,
  inboxMessageCount
} from './inbox.js'
import { cmsPagesLoad, cmsPageLoadEdit } from './cms.js'
import { parksLoad, parksLoadEdit } from './parks.js'
import {
  parkAttractionsLoad,
  parkAttractionsLoadEdit
} from './parkAttractions.js'
import {
  affiliateHome,
  affiliateAdmin,
  affiliateAdminEdit,
  affiliateAdminView
} from './affiliate.js'

const firebase = require('firebase/app').default
window.firebase = firebase
const Navigo = require('navigo')
require('firebase/auth')
require('firebase/firestore')
require('firebase/storage')
const $ = window.$
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

  window.storage = firebase.storage()
  $('body').trigger('storageLoaded')

  window.auth = firebase.auth()
  $('body').trigger('authLoaded')

  $('#signoutButton').on('click', function () {
    window.router.navigate('/signout')
  })

  // when a user signs in, out or is first seen this session in either state
  window.auth.onAuthStateChanged(function (user) {
    if (user) {
      $('.currentUsername').text(window.auth.currentUser.displayName)
      $('.userProfileImage').prop('src', window.auth.currentUser.photoURL)
      userAuthenticated(user)
    } else {
      console.log('User is unauthenticated')
      // window.location = '/signin'
    }
  })

  router.on({
    'inbox/conversation/:id': function (params) {
      console.log('I am on a inbox conversation')
      console.log(params)
      loadPage('inbox/conversation', params)
    },
    inbox: function () {
      console.log('I am on the inbox main page')
      loadPage('inbox')
    },
    cms: {
      as: 'cmsPage.list',
      uses: function (params) {
        console.log('I am on a cms list page')
        console.log(params)
        loadPage('cms', params)
      }
    },
    'cms/new': {
      as: 'cmsPage.new',
      uses: function (params) {
        console.log('I am on a cms new page')
        console.log(params)
        loadPage('cms/edit', params)
      }
    },
    'cms/:pageId': {
      as: 'cmsPage.edit',
      uses: function (params) {
        console.log('I am on a cms edit page')
        console.log(params)
        loadPage('cms/edit', params)
      }
    },
    parks: {
      as: 'parks.list',
      uses: function (params) {
        console.log('I am on a parks list page')
        console.log(params)
        loadPage('parks', params)
      }
    },
    'parks/new': {
      as: 'park.new',
      uses: function (params) {
        console.log('I am on a park new page')
        console.log(params)
        loadPage('parks/edit', params)
      }
    },
    'parks/:parkId': {
      as: 'park.edit',
      uses: function (params) {
        console.log('I am on a park edit page')
        console.log(params)
        loadPage('parks/edit', params)
      }
    },
    'parks/:parkId/attractions': {
      as: 'park.attractions.list',
      uses: function (params) {
        console.log('I am on a attractions list page')
        console.log(params)
        loadPage('parks/attractions', params)
      }
    },
    'parks/:parkId/attractions/new': {
      as: 'park.attractions.new',
      uses: function (params) {
        console.log('I am on an add attraction page page')
        console.log(params)
        loadPage('parks/attractions/edit', params)
      }
    },
    'parks/:parkId/attractions/:rideId': {
      as: 'park.attractions.edit',
      uses: function (params) {
        console.log('I am on a attractions edit page')
        console.log(params)
        loadPage('parks/attractions/edit', params)
      }
    },
    affiliate: {
      as: 'affiliate.home',
      uses: function (params) {
        console.log('I am on the affiliate home page')
        console.log(params)
        loadPage('affiliate', params)
      }
    },
    'affiliate/admin': {
      as: 'affiliate.admin',
      uses: function (params) {
        console.log('I am on the affiliate admin page')
        console.log(params)
        loadPage('affiliate/admin', params)
      }
    },
    'affiliate/admin/new': {
      as: 'affiliate.admin.new',
      uses: function (params) {
        console.log('I am on the affiliate admin, new affiliate page')
        console.log(params)
        loadPage('affiliate/admin/edit', params)
      }
    },
    'affilite/admin/:affiliateId': {
      as: 'affiliate.admin.view',
      uses: function (params) {
        console.log('I am on a affiliate admin view affiliate page')
        console.log(params)
        loadPage('affiliate/admin/view', params)
      }
    },
    '/': function () {
      console.log('I am on the home page')
      loadPage('index')
    },
    '/signout': async function () {
      console.log('I am on the signout page')
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
        if (service === 'pom.dev.parkplanr.app') {
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
    '/signin': function () {
      console.log('I am on the signin page')
      console.log('Auth Loaded, sign in flow')
      const tokenSplit = window.location.hash.split('token=')
      if (tokenSplit.length > 1) {
        console.log('Got auth token, attempt sign in with custom token')
        try {
          firebase.auth().signInWithCustomToken(tokenSplit[1])
          const postAuthUrl = window.localstorage.postAuthUrl || '/'
          delete window.localstorage.postAuthUrl
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
        if (service === 'pom.dev.parkplanr.app') {
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
    tickets: {
      as: 'tickets.list',
      uses: function (params) {
        console.log('I am on a tickets list page')
        console.log(params)
        loadPage('tickets', params)
      }
    },

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

  window.auth.currentUser
    .getIdTokenResult()
    .then((idTokenResult) => {
      // Confirm the user is an Admin or an affiliate
      if (idTokenResult.claims.admin || idTokenResult.claims.affiliate) {
        console.log('I am an admin or an affiliate')
        $('body').trigger('claimsPassed')
        inboxMessageCount()
      } else {
        console.log('I am not an admin, i should not be here')
        window.location.href = `https://parkplanr.app/notTeamMember?uid=${user.uid}`
      }
    })
    .catch((error) => {
      console.log(error)
    })
}

function load404 () {
  // TODO: This but better
  $('#contentDiv').html('4 oh 4')
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
        case 'headerNav':
          inboxMessageHeader()
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
        load404()
        return
      }

      // loads the page content into the dom
      if (isPage) {
        //    if (!$('#contentDiv').length) {
        //      console.log('Switching from standalone page, loading standard page core layout')
        //      $('#body').html('<script id="header_Holder">LoadFragment("header");</script><main id="main"></main><script id="footer_Holder">LoadFragment("footer");</script>')
        //    };
        $('#contentDiv').html(data)
      } else {
        $('body').html(data)
      }
      router.updatePageLinks()

      // updates any tags with the class CurrentYear with the YYYY year
      $('.CurrentYear').text(new Date().getFullYear())
      // scrolls back to the top of the window
      window.scrollTo(0, 0)

      switch (page) {
        case 'inbox':
          inboxMessagePage()
          break
        case 'cms':
          cmsPagesLoad()
          break
        case 'cms/edit':
          cmsPageLoadEdit(params)
          break
        case 'parks':
          parksLoad()
          break
        case 'parks/edit':
          parksLoadEdit(params)
          break
        case 'parks/attractions':
          parkAttractionsLoad(params)
          break
        case 'parks/attractions/edit':
          parkAttractionsLoadEdit(params)
          break
        case 'affiliate':
          affiliateHome(params)
          break
        case 'affiliate/admin':
          affiliateAdmin(params)
          break
        case 'affiliate/admin/edit':
          affiliateAdminEdit(params)
          break
        case 'affiliate/admin/view':
          affiliateAdminView(params)
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
