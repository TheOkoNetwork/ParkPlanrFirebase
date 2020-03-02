var rp=require("request-promise");
var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://parkplanr-dev.firebaseio.com"
});


messengerToken="***REMOVED***"
appId="147598405909139";



async function getASID(PSID) {
  var result = await rp(`https://graph.facebook.com/v6.0/${PSID}/ids_for_apps?app=${appId}&access_token=${messengerToken}`);
  result=JSON.parse(result);
  ASID=result.data[0].id;
  console.log(`The ASID for PSID: ${PSID} is: ${ASID}`);

  var nextPageToken;
  var fid;
  users=await admin.auth().listUsers(1000, nextPageToken)
  users.users.forEach(function(user) {
    user.providerData.forEach(function(providerData) {
      if (providerData.uid==ASID) {
        fid=user.uid;
      };
    });
  });

  console.log(fid);
};

getASID("2805349652879054");



