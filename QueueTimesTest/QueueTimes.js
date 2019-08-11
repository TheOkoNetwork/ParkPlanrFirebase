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
//	TPO_ThorpePark,
//	TPO_ChessingtonWorldOfAdventure
];

PreviousQueueTimes={};


const admin = require('firebase-admin');
let serviceAccount = require('serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
let db = admin.firestore();


// Access queuetimes by Promise
const CheckQueueTimes = () => {
	//console.log("Fetching queue times");
	ActiveTPO.forEach(function(TPO) {
		TPO.GetWaitTimes().then((RideTimes) => {
			RideTimes.forEach((Ride) => {
				RideStatusData={
					open: Ride.active
				};
				if (Ride.active) {
					//console.log("Ride open, using waitTime");
					RideStatusData.QueueTime=Ride.waitTime;
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
					PreviousQueueTimes[Ride.id]=RideStatusData;

					console.log(`${Ride.id} ${Ride.name} ${JSON.stringify(RideStatusData)}`);
				};
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
