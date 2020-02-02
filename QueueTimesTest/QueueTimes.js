const Themeparks = require("themeparks");

Themeparks.Settings.CacheWaitTimesLength=60;


//the TPO objects should ideally be stored in firestore with an inital load on the script init
//and a listener to restart the script if any changes to TPOs are made
//TPO's will probably be a seperate entity to Parks or Resorts, prehaps a TPJSTPO collection?
//something like
//var ActiveTPO=[];
//ActiveTPO.push(new Themeparks.Parks[TPODoc.data().TPOName]());

console.log("initializing Alton Towers Resort object");
const TPO_AltonTowersResort = new Themeparks.Parks.AltonTowers();

console.log("initializing THORPE PARK Resort object");
const TPO_ThorpePark = new Themeparks.Parks.ThorpePark();

console.log("initializing Chessington World Of Adventures Resort object");
const TPO_ChessingtonWorldOfAdventure = new Themeparks.Parks.ChessingtonWorldOfAdventures();

console.log("initializing Magic Kingdom - Walt Disney World Florida object");
const TPO_WaltDisneyWorldMagicKingdom = new Themeparks.Parks.WaltDisneyWorldMagicKingdom();

ActiveTPO=[
        TPO_AltonTowersResort,
//        TPO_ThorpePark,
  //      TPO_ChessingtonWorldOfAdventure,
  //      TPO_WaltDisneyWorldMagicKingdom
];

PreviousQueueTimes={};


const admin = require('firebase-admin');
let serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
let db = admin.firestore();

RidesTPJSIDFID={};
TPJSIDFetched=false;

// Access queuetimes by Promise
const CheckQueueTimes = () => {
	if (!TPJSIDFetched) {
		console.log("TPJS ID's not fetched");
		setTimeout(CheckQueueTimes, 1000 * 5); // try again in 5 seconds
		return;
	};
	//console.log("Fetching queue times");

	ActiveTPO.forEach(function(TPO) {
		TPO.GetWaitTimes().then((RideTimes) => {

			var batches=[];
       		 	var batchPromises=[];
        		var currentBatch=0;
		        batches[currentBatch]=db.batch();
		        var currentBatchCount=0;
		        var maxBatchCount=500;


			RideTimes.forEach((Ride) => {
				RideStatusData={
					Open: Ride.active
				};
				if (Ride.active) {
					console.log("Ride open, using waitTime");
					RideStatusData.QueueTime=Ride.waitTime;
				} else {
					console.log("Ride closed");
					RideStatusData.ClosedReason=Ride.status;
					RideStatusData.QueueTime=0;
				};

				if (PreviousQueueTimes[Ride.id]) {
					//console.log("Ride previously seen");
					if (JSON.stringify(RideStatusData) == JSON.stringify(PreviousQueueTimes[Ride.id]) ) {
						//console.log("Ride data same, not updated");
						updated=false;
					} else {
						//console.log("Ride data changed, flagging as updated");
						updated=true;
					};
				} else {
					//console.log("Ride not seen before, flagging as updated");
					updated=true;
				};
				if (updated) {
					//console.log("Ride data updated");

					if (RidesTPJSIDFID[Ride.id]) {
						PreviousQueueTimes[Ride.id]=RideStatusData;
						console.log(`${Ride.id} ${Ride.name} ${JSON.stringify(RideStatusData)} updating`);
						if (currentBatchCount >= maxBatchCount) {
                        			        console.log("Creating new batch");
                       		 		        currentBatch++;
                        			        batches[currentBatch]=db.batch();
                        		        	currentBatchCount=0;
                        			};
						console.log(RideStatusData);
                			        batches[currentBatch].update(RidesTPJSIDFID[Ride.id],RideStatusData);
                        			currentBatchCount++;
					} else {
						console.log(`*** ${Ride.id} ${Ride.name} ${JSON.stringify(RideStatusData)} TPJS ID not found ***`);
					};
				};
			});
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
//			setTimeout(CheckQueueTimes, 1000 * 60 * 1); // refresh every Minute
			setTimeout(CheckQueueTimes, 1000 * 15); // refresh every 15 seconds
		});
	});

};

CheckQueueTimes();

db.collectionGroup('Rides').onSnapshot(DocSnapshot => {
	console.log("TPJS ID's updated/initially fetched");

	TPJSIDFetched=false;
	RidesTPJSIDFID={};

	DocSnapshot.forEach(function (doc) {
		console.log(doc.id, ' => ', doc.data().Name);
		if (doc.data().TPJSID) {
			RidesTPJSIDFID[doc.data().TPJSID]=doc.ref;
		};
	});
	TPJSIDFetched=true;
}, error => {
	console.log("*****     Failed to update TPJSID     *****");
	console.log(error);
	console.log("*****     Failed to update TPJSID     *****");
});
