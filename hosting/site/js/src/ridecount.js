async function ridecountHomeLoad (params, authLoaded) {
  if (!window.db) {
    console.log('DB not ready yet, unable to load ridecount home')
    $('body').on('dbLoaded', function () {
      console.log('DB Loaded, loading ridecount home')
      ridecountHomeLoad(params)
    })
    return
  }
  if (!window.auth) {
    console.log('Auth not ready yet, unable to load ridecount home')
    $('body').on('authLoaded', function () {
      console.log('Auth Loaded, loading ridecount home')
      ridecountHomeLoad(params)
    })
    return
  }

  if (!authLoaded) {
    console.log('Waiting for auth to complete loading')
    const authWaitUnsubscribe = window.auth.onAuthStateChanged(function (user) {
      console.log('Auth loaded')
      authWaitUnsubscribe()
      ridecountHomeLoad(params, true)
    })
    return
  }

  console.log('Loading ride count home page')

  const isBrowsingUserAuthenticated = Boolean(window.auth.currentUser)
  if (isBrowsingUserAuthenticated) {
    console.log('The user browsing this page is authenticated')
  } else {
    console.log('The user browsing this page is not authenticated')
  }
}
export { ridecountHomeLoad }
