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

  var formData = {};
  $($('#affiliateEditForm').serializeArray() ).each(function(index, obj){
    formData[obj.name]=obj.value;
  });
  console.log(formData);

  var publicDocData={
    name: formData.affiliateEditFieldName,
    website: formData.affiliateEditFieldWebsite,
    slug: formData.affiliateEditFieldWebsite
  };
  var paymentDocData={
    method: "UK_BANK_TRANSFER",
    bankAccount: {
      name: formData.affiliateEditFieldPaymentName,
      sort: formData.affiliateEditFieldPaymentSort,
      account: formData.affiliateEditFieldPaymentAccount
    }
  };
  console.log(publicDocData);
  console.log(paymentDocData);
  if (!publicDocData.name || !publicDocData.website || !publicDocData.slug) {
    alert("Please provide all fields in the basic information section, remembering to generate a unique slug");
    return;
  };
  switch (paymentDocData.method) {
    case "UK_BANK_TRANSFER":
      if (!paymentDocData.bankAccount.name || !paymentDocData.bankAccount.sort || !paymentDocData.bankAccount.name) {
        alert("Please provide bank information or select another payment method");
        return;
      };
      break;
  };


  var affiliatePublicDoc;
  if (params) {
    console.log("Edit existing affiliate");
    affiliatePublicDoc = db.collection("affiliates").doc(params.affiliateId);
  } else {
    console.log("New affiliate");
    affiliatePublicDoc = db.collection("affiliates").doc();
  };
  var affiliatePaymentDoc = db.collection("affiliates").doc(affiliatePublicDoc.id).collection("private").doc("payment");

  console.log(affiliatePublicDoc);
  console.log(affiliatePaymentDoc);
}


export { affiliateHome, affiliateAdmin, affiliateAdminEdit }
