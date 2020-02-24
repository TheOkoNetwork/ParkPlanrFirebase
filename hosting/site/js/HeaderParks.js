var correllationId
function fetchHeaderParks () { // eslint-disable-line no-unused-vars
  db.collection('Parks').where('Active', '==', true).orderBy('Name', 'asc').get().then(function (parkDocs) {
    $('#HeaderParksDropdown').empty()
    var templateHeaderParksDropdown = $('#TemplateHeaderParksDropdown').html()
    if (!templateHeaderParksDropdown) {
      return
    };
    var compiledTemplateHeaderParksDropdown = Template7.compile(templateHeaderParksDropdown)
    parkDocs.forEach(function (parkDoc) {
      console.log(parkDoc.data())
      $('#HeaderParksDropdown').append(compiledTemplateHeaderParksDropdown(parkDoc.data()))
    })
  }).catch(function (errorObject) {
    console.log('Error fetching parks')
    console.log(errorObject)
    correllationId = uuidv4()
    var errorCode = 'PPERRHDRPRK'
    bugsnagClient.notify(errorObject, {
      metaData: { correllationId: correllationId, errorCode: errorCode },
      severity: 'error'
    })
  })
};
