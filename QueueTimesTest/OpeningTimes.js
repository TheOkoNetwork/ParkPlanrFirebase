const Themeparks = require("themeparks");

Themeparks.Settings.CacheWaitTimesLength=60;

console.log("initializing Alton Towers Resort object");
const TPO_AltonTowersResort = new Themeparks.Parks.AltonTowers();

console.log("initializing THORPE PARK Resort object");
const TPO_ThorpePark = new Themeparks.Parks.ThorpePark();

console.log("initializing Chessington World Of Adventures Resort object");
const TPO_ChessingtonWorldOfAdventure = new Themeparks.Parks.ChessingtonWorldOfAdventures();

ActiveTPO=[
//	TPO_AltonTowersResort,
	TPO_ThorpePark
//	TPO_ChessingtonWorldOfAdventure
];
// Access wait times by Promise

const CheckOpeningTimes = () => {
	console.log("Fetching opening times");
	ActiveTPO.forEach(function(TPO) {
		TPO.GetOpeningTimes().then((OpeningTimes) => {
			OpeningTimes.forEach((OpeningTime) => {
				switch (OpeningTime.type) {
					case "Operating":
						console.log(OpeningTime);
						break;
				};
			});
		}).catch((error) => {
			console.error(error);
		}).then(() => {
			setTimeout(CheckOpeningTimes, 1000 * 60 * 15); // refresh every 15 minutes
		});
	});

};
CheckWaitTimes();
