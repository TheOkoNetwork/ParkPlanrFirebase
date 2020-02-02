const functions = require('firebase-functions');
const admin = require('firebase-admin');

try {
        admin.initializeApp();
} catch (e) {
        //yes this is meant to be empty
}
const db = admin.firestore();
var gravatar = require('gravatar');

const CreateMissingUserDoc = functions.https.onCall((data, context) => {
        return admin.auth().getUser(context.auth.uid).then((user) => {
		return db.collection("Users").doc(user.uid).set({
                        avatar: gravatar.url(user.email),
                        //should get the latest privacy policy version here
                        privacypolicyversion: "1.0.0"
                });
	}).then((result) => {
		console.log("User document created");
		return {
			Status: true
		};
        }).catch((error) => {
                console.error("Error fetching: ", error);
		return {
			Status: false
		};
        });
});

exports  = module.exports = CreateMissingUserDoc
