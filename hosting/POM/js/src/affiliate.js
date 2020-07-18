var affiliateHome = async function (params) {
  console.log('Loading affiliate homepage')
}
var affiliateAdmin = async function (params) {
  console.log('Loading affiliate admin page')
}
var affiliateAdminEdit = async function (params) {
  console.log('Loading affiliate admin, new affiliate page')
  if (params) {
    console.log("Edit existing affiliate");
    $('.showIfAffiliateAdd').hide();
    $('.showIfAffiliateEdit').show();
  } else {
    console.log("New affiliate");
    $('.showIfAffiliateAdd').show();
    $('.showIfAffiliateEdit').hide();
  };
}

export { affiliateHome, affiliateAdmin, affiliateAdminEdit }
