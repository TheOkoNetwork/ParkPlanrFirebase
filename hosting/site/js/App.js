var correllationId
var authenticationReadyFailCount
Template7.global = {}

function LoadFragment (fragment) { // eslint-disable-line no-unused-vars
  $.get(`/fragments/${fragment}.html`, function (data) {
    try {
      var isFragment = data.startsWith('<!-- FRAGMENT CONTENT-TAG_ID -->')
      if (!isFragment) {
        console.log('Fragment HTML file not found')
        load404()
        return
      };
      $(`#${fragment}_Holder`).replaceWith(data)
      $('.CurrentYear').text(new Date().getFullYear())
      authenticationCheckStatus(firebase.auth().currentUser)

      switch (fragment) {
        case 'header':
          if (firebase.app().options.projectId === config.firebaseBetaEnviromentProject) {
            $('#headerBetaEnviroment').show()
          };
          fetchHeaderParks()
          break
        case 'footer':
          $('#footerFirebaseProjectId').text(firebase.app().options.projectId)
          $('#footerVersion').text(config.version)
          break
      };
    } catch (error) {
      console.log(error)
      showFatalErrorPage(Error, 'PPERFRGCA')
    };
  }).fail(function (error) {
    console.log(error)
    showFatalErrorPage(Error, 'PPERFRGLD')
  })
};

function loadPage (page) { // eslint-disable-line no-unused-vars
  $.get(`/pages/${page}.html`, function (data) {
    try {
      var isPage = data.startsWith('<!-- PAGE CONTENT-TAG_ID -->')
      var isStandalonePage = data.startsWith('<!-- STANDALONE PAGE CONTENT-TAG_ID -->')
      if (!isPage && !isStandalonePage) {
        console.log('Page HTML file not found')
        Load404()
        return
      };

      // loads the page content into the dom
      if (isPage) {
        if (!$('#main').length) {
          console.log('Switching from standalone page, loading standard page core layout')
          $('#body').html('<script id="header_Holder">LoadFragment("header");</script><main id="main"></main><script id="footer_Holder">LoadFragment("footer");</script>')
        };
        $('#main').html(data)
      } else {
        $('body').html(data)
      };
      // updates any tags with the class CurrentYear with the YYYY year
      $('.CurrentYear').text(new Date().getFullYear())
      // scrolls back to the top of the window
      window.scrollTo(0, 0)
      // triggers checks for authentication status (hides/shows various classes)
      authenticationCheckStatus(firebase.auth().currentUser)

      switch (page) {
        case 'index':
          fetchParkInfoCards()
          break
        case 'CMS':
          renderCMSPage()
          break
        case 'signin':
          fetchFirebaseAuthRedirectResult()
          break
        case 'ridecount':
          initRidecountPage()
          break
        case 'ridecount/user':
          initRidecountUserPage()
          break
        case 'Admin/Parks':
          initAdminParksPage()
          break
        case 'Admin/Parks/Submissions':
          initAdminParksSubmissionsPage()
          break
        case 'Admin/Parks/New':
          initAdminParksNewPage()
          break
        case 'Admin/CMS/Pages/Page':
          initAdminCMSPagesPage()
          break
        case 'Admin/CMS/Pages':
          initAdminCMSPages()
          break
      };
    } catch (error) {
      console.log(error)
      showFatalErrorPage(error, 'PPERPGCA')
    };
  }).fail(function (error) {
    console.log(error)
    showFatalErrorPage(error, 'PPERPGLD')
  })
};

window.addEventListener('popstate', function (event) {
  console.log(event)
  pushstate(event.state, '', window.location.href, true)
})
$(document).ready(function () {
  pushstate({}, window.location.href, true)
})

function pushstate (state, url, eventonly, title = config.SiteDefaultTitle) { // eslint-disable-line no-unused-vars
  // event only skips the actual history.pushState, used for running the page logic on load
  if (!eventonly) {
    console.log('Pushing state')
    window.history.pushState(state, title, url)
  };

  if (typeof (authenticationReadyFailCount) === 'undefined') {
    window.authenticationReadyFailCount = 0
  };

  if (authenticationReadyFailCount >= 500) {
    console.log('Authentication ready timeout')
    setTimeout(function () {
      showFatalErrorPage(Error('Authentication ready timeout reached'), 'PPSTAARTO')
    }, 1500)
    return
  };
  if (typeof (authenticationReady) === 'undefined') {
    console.log('Authentication not ready-var not found')
    authenticationReadyFailCount++
    console.log(authenticationReadyFailCount)
    setTimeout(function () {
      console.log('Attempting to push state again')
      pushstate(state, url, true, title)
    }, 250)
    return
  };
  if (!authenticationReady) {
    console.log('Authentication not ready-false')
    authenticationReadyFailCount++
    console.log(authenticationReadyFailCount)
    setTimeout(function () {
      console.log('Attempting to push state again')
      pushstate(state, url, true, title)
    }, 250)
    return
  };
  window.stateurl = window.location.href.split('?')[0].split('#')[0].split('/')
  console.log(window.stateurl)
  window.stateurl.splice(0, 3)
  console.log(window.stateurl)

  switch (window.stateurl[0]) {
    case '':
      console.log('Loading Index page')
      loadPage('index')
      break
    case 'about':
      console.log('Loading About page')
      loadPage('about')
      break
    case 'CIMonitoring':
      console.log('Loading CI Monitoring page')
      loadPage('CIMonitoring')
      break
    case 'Admin':
      console.log('Admin page')
      if (firebase.auth().currentUser) {
        firebase.auth().currentUser.getIdTokenResult().then((idTokenResult) => {
          console.log(idTokenResult.claims)
          if (idTokenResult.claims.Admin) {
            console.log('User is an admin, allowing access')
            if (window.stateurl[1]) {
              switch (window.stateurl[1]) {
                case 'CMS':
                  console.log('Admin CMS url')
                  if (window.stateurl[2]) {
                    switch (window.stateurl[2]) {
                      case 'Pages':
                        console.log('Pages url')
                        if (window.stateurl[3]) {
                          switch (window.stateurl[3]) {
                            case 'New':
                              console.log('New page')
                              loadPage('Admin/CMS/Pages/Page')
                              break
                            default:
                              console.log('Edit page')
                              loadPage('Admin/CMS/Pages/Page')
                          };
                        } else {
                          console.log('All pages')
                          loadPage('Admin/CMS/Pages')
                        };
                        break
                      default:
                        console.log(`Unknown second fragment: ${window.stateurl[2]}`)
                        loadCMS()
                    };
                  } else {
                    console.log('CMS root page')
                    loadPage('Admin/CMS')
                  };
                  break
                case 'Parks':
                  console.log('Admin parks url')
                  if (window.stateurl[2]) {
                    switch (window.stateurl[2]) {
                      case 'Submissions':
                        console.log('Submissions url')
                        loadPage('Admin/Parks/Submissions')
                        break
                      case 'New':
                        console.log('New url')
                        loadPage('Admin/Parks/New')
                        break
                      default:
                        console.log('Park specific url')
                        loadPage('Admin/Parks/Park')
                    };
                  } else {
                    console.log('All parks')
                    loadPage('Admin/Parks')
                  };
                  break
                default:
                  loadCMS()
              };
            } else {
              loadCMS()
            };
          } else {
            console.log('User is NOT an admin, redirecting home')
            switchPage('/')
          };
        }).catch((Error) => {
          console.log('Error getting claims')
          console.log(Error)
          showFatalErrorPage(Error, 'PPERADMIDC')
        })
      } else {
        console.log('Unauthenticated, redirecting home')
        switchPage('/')
      };
      break
    case 'ridecount':
      if (window.stateurl[1]) {
        if (window.stateurl[2]) {
          console.log('Loading Ride count trip page')
          loadPage('ridecount/trip')
        } else {
          console.log('Loading Ride count user page')
          loadPage('ridecount/user')
        };
      } else {
        console.log('Loading Ride count page')
        loadPage('ridecount')
      };
      break
    case 'signin':
      if (firebase.auth().currentUser) {
        console.log('Already signed in, redirecting to home')
        switchPage('/')
      } else {
        console.log('Loading Signin page')
        loadPage('signin')
      };
      break
    case 'forgotpassword':
      if (firebase.auth().currentUser) {
        console.log('Already signed in, redirecting to home')
        switchPage('/')
      } else {
        console.log('Loading forgot password page')
        loadPage('forgotpassword')
      };
      break
    case 'signup':
      if (firebase.auth().currentUser) {
        console.log('Already signed in, redirecting to home')
        switchPage('/')
      } else {
        console.log('Loading Signup page')
        loadPage('signup')
      };
      break
    case 'submitPark':
      if (window.stateurl[1]) {
        if (window.stateurl[1] === 'thanks') {
          console.log('Loading submit park thanks page')
          loadPage('submitParkThanks')
        } else {
          console.log(`Unknown submitPark 2nd window.stateurl fragment: ${window.stateurl[1]}`)
          loadCMS()
        };
      } else {
        console.log('Loading submit park page')
        loadPage('submitPark')
      };
      break
    case 'parks':
      if (window.stateurl[1]) {
        if (window.stateurl[2]) {
          console.log('Specific park sub page')
          loadCMS()
        } else {
          console.log('Loading park information page')
          loadPage('parks/park')
        };
      } else {
        console.log('Loading park list page')
        loadPage('parks')
      };
      break
    default:
      loadCMS()
  };
};

function loadPageTag (element) { // eslint-disable-line no-unused-vars
  console.log(element)
  var pageTagUrl = $(element).attr('href')
  pushstate(null, pageTagUrl, false, config.SiteDefaultTitle)
  if ($('#navbar_global').find('.collapse-close').is(':visible')) {
    console.log('Nav bar needs collapsing')
    $('#navbar_global').find('.collapse-close').find('a').click()
  };
};

function switchPage (pageUrl) { // eslint-disable-line no-unused-vars
  pushstate(null, pageUrl, false, config.SiteDefaultTitle)
};

function Load404 () { // eslint-disable-line no-unused-vars
  console.log('Loading 404 page')
  loadPage('404')
};

// Template7.registerHelper('loadFragment', function (fragment) {
//  return `<script id="${fragment}_Holder">LoadFragment('${fragment}');</script>`;
// });

function showFatalErrorPage (errorObject, code) { // eslint-disable-line no-unused-vars
  if (!code) {
    code = 'PPERFATAL'
  };

  console.log('***** Fatal Error *****')
  console.log(errorObject)
  console.log(code)
  console.log('***** Fatal Error *****')

  correllationId = uuidv4()
  bugsnagClient.notify(errorObject, {
    metaData: { correllationId: correllationId, ErrorCode: code },
    severity: 'error'
  })

  // window.location.href="/VeryBadError";
};

function uuidv4 () { // eslint-disable-line no-unused-vars
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0; var v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
};

function genericError (errorObject, code) { // eslint-disable-line no-unused-vars
  $('#GenericError').modal()
  $('#GenericErrorErrorCode').text(code)

  console.log(errorObject)
  console.log(code)
  correllationId = uuidv4()

  bugsnagClient.notify(errorObject, {
    metaData: { correllationId: correllationId, ErrorCode: code },
    severity: 'error'
  }, function (errorObject, report) {
    if (errorObject) {
      console.log('Failed to send report because of:\n' + errorObject.stack)
      showFatalErrorPage(errorObject, 'PPGENERBSNER')
      $('#GenericErrorcorrellationId').text('Please wait')
    } else {
      console.log('Successfully sent report "' + report.errorMessage + '"')
      $('#GenericErrorcorrellationId').text(correllationId)
    };
  })
};

function loadCMS (ShowHiddenPages) { // eslint-disable-line no-unused-vars
  var pageSLUG = window.stateurl.join('/')
  db.collection('CMSPages').where('SLUG', '==', pageSLUG).where('Public', '==', true).get().then(function (CMSPages) {
    if (CMSPages.empty) {
      console.log(`No CMS page for SLUG: ${pageSLUG} found`)
      if (firebase.auth().currentUser) {
        firebase.auth().currentUser.getIdTokenResult().then((idTokenResult) => {
          console.log(idTokenResult.claims)
          if (idTokenResult.claims.Admin) {
            if (ShowHiddenPages) {
              console.log('Admin but already tried loading hidden page, loading 404')
              return Load404()
            } else {
              console.log('Admin, attempting to load hidden page')
              return loadCMS(true)
            };
          } else {
            console.log('Not Admin, loading 404')
            return Load404()
          };
        }).catch((errorObject) => {
          console.log('Error getting claims')
          console.log(errorObject)
          showFatalErrorPage(errorObject, 'PPERCMSLDIDC')
        })
      } else {
        console.log('Unauthenticated, loading 404')
        return Load404()
      };
    } else {
      if (CMSPages.docs.length > 1) {
        console.log("**Duplicate CMS page SLUG's found")
        bugsnagClient.notify(new window.Error("Duplicate CMS page SLUG's found"), {
          metaData: { pageSLUG: pageSLUG, ErrorCode: 'PPERCMSLDDUP' },
          severity: 'error'
        })
      };
      window.cmsPageDoc = CMSPages.docs[0]
      console.log('CMS Page found')
      console.log(cmsPageDoc)
      loadPage('CMS')
    };
  }).catch(function (errorObject) {
    showFatalErrorPage(errorObject, 'PPERCMSLDCA')
  })
};

Template7.registerHelper('switch', function (value, options) {
  this._switch_value_ = value
  this._switch_break_ = false
  const html = options.fn(this)
  delete this._switch_break_
  delete this._switch_value_
  return html
})
Template7.registerHelper('case', function (value, options) {
  const args = Array.prototype.slice.call(arguments)
  options = args.pop()
  const caseValues = args

  if (this._switch_break_ || caseValues.indexOf(this._switch_value_) === -1) {
    return ''
  } else {
    this._switch_break_ = true
    return options.fn(this)
  }
})

Template7.registerHelper('default', function (options) {
  if (!this._switch_break_) {
    return options.fn(this)
  } else {
    return ''
  }
})
