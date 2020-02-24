var correllationId

function SubmitParkNextName () { // eslint-disable-line no-unused-vars
  var parkName = $('#SubmitParkName').val()

  if (!parkName) {
    console.log('Park name empty or not provided')
    $('#SubmitParkNameRequiredError').modal()
    $('#SubmitParkSectionWebsite').hide()
  } else {
    console.log('Park name provided')
    $('#SubmitParkSectionWebsite').show()
    $('html, body').animate({
      scrollTop: $('#SubmitParkSectionWebsite').offset().top
    }, 1000)
  };
};

function SubmitParkNextWebsite () { // eslint-disable-line no-unused-vars
  if (firebase.auth().currentUser) {
    console.log('User is signed in, bypassing email input box')
    $('#SubmitParkUserEmail').val(firebase.auth().currentUser.email)
    $('#SubmitParkUserEmail').val(firebase.auth().currentUser.email).attr('disabled', true)
    $('#SubmitParkSectionUserEmail').hide()

    $('#SubmitParkSectionAdditionalInformation').show()
    $('html, body').animate({
      scrollTop: $('#SubmitParkSectionAdditionalInformation').offset().top
    }, 1000)
  } else {
    console.log('User is unauthenticated, showing email input box')
    $('#SubmitParkSectionUserEmail').show()
    $('html, body').animate({
      scrollTop: $('#SubmitParkSectionUserEmail').offset().top
    }, 1000)
  };
};

function SubmitParkNextEmail () { // eslint-disable-line no-unused-vars
  $('#SubmitParkSectionAdditionalInformation').show()
  $('html, body').animate({
    scrollTop: $('#SubmitParkSectionAdditionalInformation').offset().top
  }, 1000)
};

function SubmitParkNextAdditionalInformation () { // eslint-disable-line no-unused-vars
  SubmitParkSubmit()
};

function SubmitParkSubmit () { // eslint-disable-line no-unused-vars
  console.log('Park submission triggered')
  var parkName = $('#SubmitParkName').val()
  var parkWebsite = $('#SubmitParkWebsite').val()
  var userEmail = $('#SubmitParkUserEmail').val()
  var additionalInformation = $('#SubmitParkAdditionalInformation').val()

  if (!parkName) {
    console.log('Park name empty or not provided')
    $('#SubmitParkNameRequiredError').modal()
    $('#SubmitParkSectionWebsite').hide()
    $('#SubmitParkSectionUserEmail').hide()
    $('#SubmitParkSectionAdditionalInformation').hide()
    $('html, body').animate({
      scrollTop: $('#SubmitParkSectionName').offset().top
    }, 1000)
  };

  var submissionData = {
    park: {
      name: parkName,
      website: parkWebsite
    },
    submitter: {
      email: userEmail
    },
    additionalInformation: additionalInformation,
    submissionTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
    status: 0
  }
  if (firebase.auth().currentUser) {
    submissionData.submitter.uid = firebase.auth().currentUser.uid
  };
  console.log(submissionData)

  db.collection('ParkSubmissions').doc().set(submissionData).then(function (submissionData) {
    console.log('Submitted park')
    switchPage('/submitPark/thanks')
  }).catch(function (errorObject) {
    console.log('Error submitting park')
    console.log(errorObject)
    // ERROR: #PPERPKSUCA
    $('#SubmitParkSubmissionError').modal()

    correllationId = uuidv4()
    $('#SubmitParkSubmissionErrorcorrellationId').text(correllationId)

    bugsnagClient.notify(Error, {
      metaData: { correllationId: correllationId, sSubmissionData: submissionData },
      severity: 'error'
    })
  })
};
