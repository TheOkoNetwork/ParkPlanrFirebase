const functions = require('firebase-functions');
const admin = require('firebase-admin');

try {
        admin.initializeApp();
} catch (e) {
        //yes this is meant to be empty
}
const db = admin.firestore();


const OnRideCountAddEditOrDelete = functions.firestore.document('Users/{UID}/RideCount/{TripId}/Rides/{CountId}').onWrite((change, context) => {
	if (change.before.exists) {
		console.log("Existing count doc");
		if (change.after.exists) {
			console.log("Doc updated");
			BeforeCount=change.before.data().Count;
			AfterCount=change.after.data().Count-BeforeCount;
			CountValue=admin.firestore.FieldValue.increment(Count);
		} else {
			console.log("Doc deleted");
			Count=0-change.before.data().Count;
			CountValue=admin.firestore.FieldValue.increment(Count);
		}
	} else {
		console.log("New count doc");
		Count=change.after.data().Count;
		CountValue=admin.firestore.FieldValue.increment(Count);
	}
	console.log(`Incrementing count: ${Count}`);
	return db.collection("Users").doc(context.params.UID).collection("RideCount").doc(context.params.TripId).update({
		TotalRides: CountValue
	}).then((result) => {
		return console.log("Updated ride count Total Rides");
	}).catch((error) => {
		console.log("Error Updating ride count Total Rides");
		return console.log(error);
	});
});
exports = module.exports = OnRideCountAddEditOrDelete
