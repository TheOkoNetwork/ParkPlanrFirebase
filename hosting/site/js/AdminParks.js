var correllationId

function initAdminParksPage () { // eslint-disable-line no-unused-vars
  db.collection('ParkSubmissions').get().then(function (ParkSubmissions) {
    var submissionCount = ParkSubmissions.docs.length
    if (submissionCount) {
      console.log('At least one park submission')
      $('#AdminParksUserSubmissionsBtn').show()
    } else {
      $('#AdminParksUserSubmissionsBtn').hide()
    };
  }).catch(function (errorObject) {
    console.log('Failed to get park submissions')
    correllationId = uuidv4()
    var errorCode = 'PPERRADMPKSUB'
    bugsnagClient.notify(errorObject, {
      metaData: { correllationId: correllationId, errorCode: errorCode },
      severity: 'error'
    })
  })

  db.collection('Parks').orderBy('Name', 'asc').get().then(function (parkDocs) {
    var templateAdminParksPark = $('#TemplateAdminParksPark').html()
    var compiledTemplateAdminParksPark = Template7.compile(templateAdminParksPark)

    $('#AdminParksDiv').empty()
    parkDocs.forEach(function (parkDoc) {
      console.log(parkDoc)
      var park = parkDoc.data()
      park.ID = parkDoc.id

      $('#AdminParksDiv').append(compiledTemplateAdminParksPark(park))
    })
  }).catch(function (errorObject) {
    showFatalErrorPage(errorObject, 'PPADMPKDFCA')
  })
};

var submissionStatusDescriptions = {
  0: 'Pending review',
  1: 'Rejected',
  2: 'Approved'
}
// var submissionStatusReasons = {
//  PARKEXISTS: 'Park already added.',
//  DUPLICATESAMEUSER: 'Duplicate of another submission by this user.',
//  DUPLICATEOTHERUSER: 'Duplicate of a submission by another user.',
//  SPAM: 'API flagged spam',
//  SPAMADM: 'Manually flagged as spam',
//  TOS: 'TOS violation',
//  LEGAL: 'Legal reasons.',
//  APPROVEDTODO: 'Approved, TODO',
//  APPROVEDINPROGRESS: 'Approved-Working on',
//  APPROVEDADDED: 'Approved-Added',
//  ADMINNEEDINFO: 'Need information from user'
// }

function initAdminParksSubmissionsPage () { // eslint-disable-line no-unused-vars
  db.collection('ParkSubmissions').get().then(function (parkSubmissions) {
    if (!parkSubmissions.docs.length) {
      console.log('No park submissions pending approval')
      return
    };

    var compiledTemplateAdminParkSubmission = Template7.compile($('#TemplateAdminParkSubmission').html())

    parkSubmissions.forEach(function (parkSubmission) {
      var submission = parkSubmission.data()
      submission.id = parkSubmission.id

      if (submissionStatusDescriptions[submission.status]) {
        submission.statusDescription = submissionStatusDescriptions[submission.status]
      } else {
        submission.statusDescription = '*Unknown status*'
      };
      console.log(submission)
      $('#AdminParksSubmissionsDiv').append(compiledTemplateAdminParkSubmission(submission))
    })
  }).catch(function (errorObject) {
    console.log('Failed to get park submissions')
  })
};

function AdminParkSubmissionReject () { // eslint-disable-line no-unused-vars
  $('#AdminParkSubmissionRejectModal').modal()
};

function initAdminParksNewPage () { // eslint-disable-line no-unused-vars
  $('#AdminParkNewCountry').countrySelect({
    defaultCountry: 'gb',
    preferredCountries: ['gb', 'us', 'ca', 'de'],
    responsiveDropdown: true
  })
};

function AdminParkNewSubmit () { // eslint-disable-line no-unused-vars
  var Park = {
    Name: $('#AdminParkNewName').val(),
    ParkCode: $('#AdminParkNewParkCode').val(),
    Website: $('#AdminParkNewWebsiteURL').val(),
    Logo: $('#AdminParkNewLogoURL').val(),
    Country: $('#AdminParkNewCountry_code').val().toUpperCase(),
    Active: false,
    Queuetimes: false,
    Ridecount: false,
    OpeningTodayLastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
    Created: firebase.firestore.FieldValue.serverTimestamp()
  }

  var mapURL = $('#AdminParkNewMapURL').val()
  if (mapURL) {
    console.log('Map URL provided, flagging as Maps true')
    Park.Map = mapURL
    Park.Maps = true
  };

  if (!Park.Name) {
    console.log('Park name must be provided')
    return
  };
  if (!Park.ParkCode) {
    console.log('A park code must be provided')
    return
  };
  if (!Park.Logo) {
    console.log('A park logo URL must be provided')
    return
  };

  db.collection('Parks').where('ParkCode', '==', Park.ParkCode).get().then(function (ParkDocs) {
    if (ParkDocs.empty) {
      console.log('No existing park with that park code found')
      var parkDocRef = db.collection('Parks').doc()
      parkDocRef.set(Park).then(function () {
        console.log(`Park created: ${parkDocRef.id}`)
        switchPage(`/Admin/Parks/${parkDocRef.id}`)
      }).catch(function (errorObject) {
        genericError(errorObject, 'PPERADMPKADF')
      })
    } else {
      var existingParkCodeDoc = ParkDocs.docs[0]
      console.log(`Duplicate park code, ${Park.ParkCode} is in use by ${existingParkCodeDoc.data().Name} (ID: ${existingParkCodeDoc.id})`)
    };
  }).catch(function (errorObject) {
    genericError(errorObject, 'PPERADMPKPKCHKF')
  })
};
