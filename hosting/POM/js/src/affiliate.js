var affiliateHome = async function (params) {
  console.log('Loading affiliate homepage')
}
var affiliateAdmin = async function (params) {
  console.log('Loading affiliate admin page')
}
var affiliateAdminEdit = async function (params) {
  console.log('Loading affiliate admin, new/edit affiliate page')

  if (params) {
    console.log("Edit existing affiliate");
    $('.showIfAffiliateAdd').hide();
    $('.showIfAffiliateEdit').show();
  } else {
    console.log("New affiliate");
    $('.showIfAffiliateAdd').show();
    $('.showIfAffiliateEdit').hide();
  };


  $('#affiliateAdminEditSaveBtn').on('click', affiliateAdminEditSave);
}


var affiliateAdminEditSave = async function () {
  console.log('Affiliate admin, new/edit affiliate save')
  var params=window.router._lastRouteResolved.params;

  
  if (params) {
    console.log("Edit existing affiliate");
  } else {
    console.log("New affiliate");
  };
}


export { affiliateHome, affiliateAdmin, affiliateAdminEdit }
