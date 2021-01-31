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

  $('#wizardFormTabWelcome').find('.service').each(function() {
    $(this).on('click', function() {
      const serviceId = $(this).data('service');
      console.log(`${serviceId} selected`);

      $('#wizardFormTabWelcome').find('.service')
        .addClass('disabled')
        .removeClass('selected');
        
      $(this)
        .removeClass('disabled')
        .addClass('selected');
    })
  })
  
  $('#wizardFormNext').on('click', async function() {
    console.log("Next button clicked");
    const currentPage = $('.wizardFormTab:visible').first().data('page');
    switch (currentPage) {
      case "welcome":
        console.log("Next clicked on welcome page");
        const selectedService = $('#wizardFormTabWelcome')
          .find('.service.selected')
          .data('service');
        console.log(`Service: ${selectedService} selected`);
        if (selectedService) {
          switch (selectedService) {
            case "other":
              console.log("Unsupported service selected");
              wizardPage("unsupportedService");
              break;
            case "ridecountcom":
              console.log("ridecount.com selected");
              wizardPage("ridecountcomUser");
              break;
          }
        } else {
          console.log("No service selected");
          window.alert("Please select which service or app you want to bring your trips over from")
        }
        break;
      case "ridecountcomUser":
        console.log("Next clicked on ridecount.com username input page");
        const ridecountcomUsername = $('#ridecountcomUsername').val();
        if (ridecountcomUsername) {
          console.log(`${ridecountcomUsername} entered`);
          wizardPage("ridecountcomUserConfirm");
        } else {
          console.log("No username entered.");
          window.alert("Please enter your username for ridecount.com");
        }
        break;
    }
  })


  $('#wizardFormPrevious').on('click', async function() {
    console.log("Previous button clicked");
    const currentPage = $('.wizardFormTab:visible').first().data('page');
    switch (currentPage) {
      case "unsupportedService":
        console.log("Previous clicked on unsupported service page");
        wizardPage("welcome");
        break;
      case "ridecountcomUser":
        console.log("Previous clicked on ridecount.com username input page");
        wizardPage("welcome");
        break; 
      case "ridecountcomUserConfirm":
        console.log("Previous clicked on ridecount.com username confirm page");
        wizardPage("ridecountcomUser");
        break;  
    }
  })

  $('#wizardFormFinish').on('click', async function() {
    console.log("Previous button clicked");
    const currentPage = $('.wizardFormTab:visible').first().data('page');

    switch (currentPage) {
      case "ridecountcomUserConfirm":
        console.log("Finish button clicked on ridecount.com username confirm page");
        const ridecountcomUsername = $('#ridecountcomUsername').val();
        try {
          await window.db.collection("ridecountMigrationRequests").doc().set({
            service: "ridecountcom",
            ridecountcomUsername: ridecountcomUsername,
            user: window.auth.currentUser.uid,
            status: 0,
            inProgress: true
          })
          console.log(`Requested migration for username: ${ridecountcomUsername}`);
          wizardPage("importInProgress");
        } catch (err) {
          console.log("Got error creating migration request");
          console.log(err);
          //@todo this but prettier and with a correllation Id
          window.alert("Sorry, something went wrong migrating your trips");
        }
        break;
    }

    $('#unsupportedServiceRequestButton').on('click', function() {
      console.log("Request an unsupported service button clicked");
      window.router.navigate(
        window.router.generate('contact', {
          contactReason: "submitRidecountImportService"
        })
      )
    })
  });

  const isBrowsingUserAuthenticated = Boolean(window.auth.currentUser)
  if (isBrowsingUserAuthenticated) {
    console.log('The user browsing this page is authenticated');
    wizardPage("welcome");
  } else {
    console.log('The user browsing this page is not authenticated')
  }
}

const wizardStep = function(step) {
  $('.wizardFormStep').removeClass('active').eq(step).addClass('active');
}
const wizardPage = async function(page) {
  $('.wizardFormTab').hide();
  $('#wizardFormPrevious').hide();
  $('#wizardFormNext').hide();
  $('#wizardFormFinish').hide();

  switch (page) {
    case "welcome":
      const existingRequestQuery = await window.db
        .collection("ridecountMigrationRequests")
        .where("user","==",window.auth.currentUser.uid)
        .where("inProgress","==",true).get()
      if (!existingRequestQuery.empty) {
        console.log("There is an existing migration request open for this user");
        return wizardPage("importInProgress");
      }
      console.log("Loading wizard welcome page");
      $('#wizardFormTabWelcome').show();
      $('#wizardFormNext').show();
      wizardStep(0);
      break;

    case "unsupportedService":
      console.log("Loading wizard unsupported service page");
      $('#wizardFormTabUnsupportedService').show();
      $('#wizardFormPrevious').show();
      wizardStep(3);
      break;

    case "ridecountcomUser":
      console.log("Loading wizard ridecount.com username entry page");
      $('#wizardFormTabRidecountcomUser').show();
      $('#wizardFormPrevious').show();
      $('#wizardFormNext').show();
      wizardStep(1);
      break;

    case "ridecountcomUserConfirm":
      console.log("Loading wizard ridecount.com username confirm page");
      $('#wizardFormTabRidecountcomUserConfirm').show();
      const ridecountcomUsername = $('#ridecountcomUsername').val();
      $('#ridecountcomUserConfirmUsername').text(ridecountcomUsername);
      $('#wizardFormPrevious').show();
      $('#wizardFormFinish').show();
      wizardStep(2);
      break;
  
    case "importInProgress":
      console.log("Loading import in progress page");
      $('#wizardFormTabImportInProgress').show();
      wizardStep(3);
      break;
  }
}
export { ridecountHomeLoad, ridecountImportLoad }
