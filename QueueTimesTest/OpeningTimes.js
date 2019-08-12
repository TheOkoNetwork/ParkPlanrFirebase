const Themeparks = require("themeparks");

Themeparks.Settings.CacheWaitTimesLength=60;

console.log("initializing Alton Towers Resort object");
const TPO_AltonTowersResort = new Themeparks.Parks.AltonTowers();

console.log("initializing THORPE PARK Resort object");
const TPO_ThorpePark = new Themeparks.Parks.ThorpePark();

console.log("initializing Chessington World Of Adventures Resort object");
const TPO_ChessingtonWorldOfAdventure = new Themeparks.Parks.ChessingtonWorldOfAdventures();

ActiveTPO=[
	TPO_AltonTowersResort,
	TPO_ThorpePark,
	TPO_ChessingtonWorldOfAdventure
];

const admin = require('firebase-admin');
let serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
let db = admin.firestore();

TPJSNameFetched=false;
ParksTPJSNameFID={};

// Access opening times by Promise
const CheckOpeningTimes = () => {
	if (!TPJSNameFetched) {
		console.log("TPJS Names's not fetched");
		setTimeout(CheckOpeningTimes, 1000 * 5); // try again in 5 seconds
		return;
	};

	console.log("Fetching opening times");

	ActiveTPO.forEach(function(TPO,index) {
			TPO.GetOpeningTimes().then((OpeningTimes) => {
			var batches=[];
       		 	var batchPromises=[];
        		var currentBatch=0;
		        batches[currentBatch]=db.batch();
		        var currentBatchCount=0;
		        var maxBatchCount=500;


//			OpeningTimes.forEach((OpeningTime) => {
//			});

			OpeningTime=OpeningTimes[0];
			ParkStatusData={};
			if (OpeningTime.type=="Operating") {
				console.log("Park open");
				ParkStatusData.OpenToday=true;
				ParkStatusData.OpeningToday=admin.firestore.Timestamp.fromDate(new Date(OpeningTime.openingTime));
				ParkStatusData.ClosingToday=admin.firestore.Timestamp.fromDate(new Date(OpeningTime.closingTime));
			} else {
				console.log("Park closed");
				ParkStatusData.OpenToday=false;
			};
			ParkStatusData.OpeningTodayLastUpdated=admin.firestore.FieldValue.serverTimestamp();

			console.log(OpeningTime);
			//console.log(ParkStatusData);
			console.log(TPO.Name);

			if (ParksTPJSNameFID[TPO.Name]) {
				batches[currentBatch].update(ParksTPJSNameFID[TPO.Name],ParkStatusData);
				currentBatchCount++;
			} else {
				console.log(`TPJS Park Name ${TPO.Name} Not found`)
			};
			batches.forEach((batch) => {
	                        batchPromises.push(batch.commit());
	                });

	                return Promise.all(batchPromises).then((data) => {
	                	batchCount=data.length;
	                	return console.log(`Comitted ${batchCount} batches`);
	                }).catch((error) => {
				return console.log("Error Commiting documents: ", error);
	               	});
		}).catch((error) => {
			console.log("*****     ERROR FETCHING QUEUE TIMES     *****");
			console.error(error);
			console.log("*****     ERROR FETCHING QUEUE TIMES     *****");
		}).then(() => {
			setTimeout(CheckOpeningTimes, 1000 * 60 * 1); // refresh every minute
		});
	});

};

CheckOpeningTimes();

db.collection('Parks').onSnapshot(DocSnapshot => {
	//console.log("TPJS Names's updated/initially fetched");

	TPJSNameFetched=false;
	ParksTPJSNameFID={};

	DocSnapshot.forEach(function (doc) {
		//console.log(doc.id, ' => ', doc.data());
		if (doc.data().TPJSName) {
			ParksTPJSNameFID[doc.data().TPJSName]=doc.ref;
		};
	});
	TPJSNameFetched=true;
}, error => {
	console.log("*****     Failed to update TPJSID     *****");
	console.log(error);
	console.log("*****     Failed to update TPJSID     *****");
});
