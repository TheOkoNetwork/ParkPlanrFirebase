const Template7 = require('template7').default

async function initHeaderParksDropdown () {
  const dropdownTemplate = $('#templateHeaderParksDropdown').html()
  const compiledDropdownTemplate = Template7.compile(dropdownTemplate)
  const parkDocs = await window.db
    .collection('parks')
    .where('active', '==', true)
    .orderBy('name.name', 'asc')
    .get()
  parkDocs.forEach(function (parkDoc) {
    console.log(parkDoc)
    const parkData = parkDoc.data()
    parkData.id = parkDoc.id
    console.log(parkData)
    $('#headerParksDropdown').append(compiledDropdownTemplate(parkData))
  })
}
export { initHeaderParksDropdown }
