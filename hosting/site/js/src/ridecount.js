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

async function ridecountImportLoad (params, authLoaded) {
  if (!window.db) {
    console.log('DB not ready yet, unable to load ridecount import')
    $('body').on('dbLoaded', function () {
      console.log('DB Loaded, loading ridecount import')
      ridecounImportLoad(params)
    })
    return
  }
  if (!window.auth) {
    console.log('Auth not ready yet, unable to load ridecount import')
    $('body').on('authLoaded', function () {
      console.log('Auth Loaded, loading ridecount import')
      ridecountImportLoad(params)
    })
    return
  }

  if (!authLoaded) {
    console.log('Waiting for auth to complete loading')
    const authWaitUnsubscribe = window.auth.onAuthStateChanged(function (user) {
      console.log('Auth loaded')
      authWaitUnsubscribe()
      ridecountImportLoad(params, true)
    })
    return
  }

  console.log('Loading ride count import page')

  const isBrowsingUserAuthenticated = Boolean(window.auth.currentUser)
  if (isBrowsingUserAuthenticated) {
    console.log('The user browsing this page is authenticated');
    wizardPage("welcome");
  } else {
    console.log('The user browsing this page is not authenticated')
  }
}

const wizardPage = async function(page) {
  $('.wizardFormTab').hide();
  $('#wizardFormPrevious').hide();
  $('#wizardFormNext').hide();

  switch (page) {
    case "welcome":
      console.log("Loading wizard welcome page");
      $('#wizardFormTabWelcome').show();
      $('#wizardFormNext').show();
    }
}
export { ridecountHomeLoad, ridecountImportLoad }
