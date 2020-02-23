function initRidecountPage() {
	if (firebase.auth().currentUser) {
		dataGetPromises=[
			db.collection("Parks").where("Active","==",true).get(),
			db.collection("Users").doc(firebase.auth().currentUser.uid).collection("RideCount").orderBy("Date","desc").limit(12).get()
		];
		Promise.all(dataGetPromises).then(function(PromiseResults) {
			console.log(PromiseResults);

			Data={
			};

			PromiseResults.forEach(function(PromiseResult) {
				console.log(PromiseResult);

				switch(PromiseResult._originalQuery.path.segments[0]) {
					case "Parks":
						ParkDocs=PromiseResult;
						console.log(ParkDocs);
						Data.Parks={};
						ParkDocs.forEach(function(ParkDoc) {
							console.log(`Loading park: ${ParkDoc.id}`);
							Data.Parks[ParkDoc.id]=ParkDoc.data();
						});
						break;
					case "Users":
						TripDocs=PromiseResult;
						console.log(TripDocs);
						Data.Trips={};
						TripDocs.forEach(function(TripDoc) {
							Trip=TripDoc.data();
							Trip.id=TripDoc.id;
							Trip.User=TripDoc.ref.path.split('/')[1];
							Trip.DateString=moment(Trip.Date.toDate()).calendar(null, {
								sameDay: '[Today]',
								nextDay: '[Tomorrow]',
								nextWeek: 'dddd',
								lastDay: '[Yesterday]',
								lastWeek: '[Last] dddd',
								sameElse: 'DD/MM/YYYY'
							});
							Data.Trips[TripDoc.id]=Trip;
						});
						break;
					default:
						console.log(`Unknown segment: ${PromiseResult._originalQuery.path.segments[0]}`);
						break;
				};
			});
			console.log(Data);
			if (!Data.Trips) {
				console.log("No trips");
			} else {
				TemplateRidecountMyTripsRowDivTrip=$('#TemplateRidecountMyTripsRowDivTrip').html();
				CompiledTemplateRidecountMyTripsRowDivTrip=Template7.compile(TemplateRidecountMyTripsRowDivTrip);
				Object.keys(Data.Trips).forEach(function(TripId) {
					Trip=Data.Trips[TripId];
					Trip.Park=Data.Parks[Trip.Park];
					console.log(Trip);
					$('#RidecountMyTripsRowDiv').append(CompiledTemplateRidecountMyTripsRowDivTrip(Trip));
				});
			};
		});
	};
};


function InitRidecountUserPage() {
	stateurl=location.href.split('?')[0].split('#')[0].split('/')
        console.log(stateurl);
        stateurl.splice(0,3);
        console.log(stateurl);


	console.log(`Looking up user id for user: ${stateurl[1]}`);
	db.collection("Users").where("Username","==",stateurl[1]).where("Public","==",true).limit(1).get().then(function(UserDocs) {
		if (UserDocs.empty) {
			console.log("User not found");
			Load404();
			return;
		} else {
			console.log("User found");
			UserDoc=UserDocs.docs[0];
			console.log(UserDoc);
		};
	}).catch(function(ErrorObject) {
		console.log("Error looking up user id by username");
		CorrellationId=uuidv4();
		ErrorCode="PPERRCUSRLK";
		bugsnagClient.notify(ErrorObject, {
			metaData: { CorrellationId: CorrellationId, ErrorCode: ErrorCode},
			severity: 'error'
		});
	});
};
