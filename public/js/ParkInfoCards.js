function FetchParkInfoCards() {
	TemplateParkInfoCard=$('#TemplateParkInfoCard').html();
	if (!TemplateParkInfoCard) {
		clearTimeout(window.ParkInfoCardsOnSnapshotLastUpdatedTimeout);
		return;
	};
	CompiledTemplateParkInfoCard=Template7.compile(TemplateParkInfoCard);

	TemplateParkInfoCardQueueTime=$('#TemplateParkInfoCardQueueTime').html();
	CompiledTemplateParkInfoCardQueueTime=Template7.compile(TemplateParkInfoCardQueueTime);

	if (window.ParkInfoCardsOnSnapshot) {
		window.ParkInfoCardsOnSnapshot();
		if (window.ParkInfoCardsQueuesOnSnapshots) {
			window.ParkInfoCardsQueuesOnSnapshots.forEach(function(QueueOnSnapshot) {
				QueueOnSnapshot();
			});
		} else {
			window.ParkInfoCardsQueuesOnSnapshots=[];
		};
		clearTimeout(window.ParkInfoCardsOnSnapshotLastUpdatedTimeout);
	} else {
		window.ParkInfoCardsQueuesOnSnapshots=[];
	};
	window.ParkInfoCardsOnSnapshotLastUpdatedTimeout=setTimeout(function() {
		FetchParkInfoCards();
	}, 60000);
	window.ParkInfoCardsOnSnapshot=db.collection("Parks").where("Active","==",true).limit(3).onSnapshot(ParkInfoSnapshot => {
		ParkInfoSnapshot.docChanges().forEach(function(ParkInfoDocChange) {
			ParkInfoDoc=ParkInfoDocChange.doc;
			switch (ParkInfoDocChange.type) {
				case "added":
					console.log(`${ParkInfoDoc.data().Name} Added to query results`);

					if ($(`#ParkInfoCard_${ParkInfoDoc.id}`).length) {
						QueueTimesHtml=$(`#ParkInfoCard_${ParkInfoDoc.id}`).find('.ParkInfoCardQueueTimes').html();
						$(`#ParkInfoCard_${ParkInfoDoc.id}`).replaceWith(CompiledTemplateParkInfoCard(ParkInfoDoc));
						$(`#ParkInfoCard_${ParkInfoDoc.id}`).find('.ParkInfoCardQueueTimes').html(QueueTimesHtml);
						return;
					};



					$('#ParkInfoCards').append(CompiledTemplateParkInfoCard(ParkInfoDoc));
					window.ParkInfoCardsQueuesOnSnapshots.push(ParkInfoDoc.ref.collection("Rides").where("QueueTimes","==",true).orderBy("QueueTime","desc").limit(3).onSnapshot(QueueInfoSnapshot => {
						console.log(QueueInfoSnapshot);
						if (QueueInfoSnapshot.empty) {
							return;
						};
						ParkDocId=QueueInfoSnapshot.docs[0].ref.path.split('/')[1];
						$(`#ParkInfoCard_${ParkDocId}`).find('.ParkInfoCardQueueTimes').empty();
						QueueInfoSnapshot.forEach(function(RideDoc) {
							console.log(RideDoc);
							$(`#ParkInfoCard_${ParkDocId}`).find('.ParkInfoCardQueueTimes').append(CompiledTemplateParkInfoCardQueueTime(RideDoc));
						});
					}, ErrorObject => {
						console.log(ErrorObject);
						CorrellationId=uuidv4();
				                ErrorCode="PPERPKINFCDQU";
                				bugsnagClient.notify(ErrorObject, {
                				        metaData: { CorrellationId: CorrellationId, ErrorCode: ErrorCode},
                        				severity: 'error'
				                });
					}));
					break;
				case "modified":
					console.log(`${ParkInfoDoc.data().Name} changed`);
					QueueTimesHtml=$(`#ParkInfoCard_${ParkInfoDoc.id}`).find('.ParkInfoCardQueueTimes').html();
					$(`#ParkInfoCard_${ParkInfoDoc.id}`).replaceWith(CompiledTemplateParkInfoCard(ParkInfoDoc));
					$(`#ParkInfoCard_${ParkInfoDoc.Id}`).find('.ParkInfoCardQueueTimes').html(QueueTimesHtml);
					break;
				case "removed":
					console.log(`${ParkInfoDoc.data().Name} Removed from query results`);
					$(`#ParkInfoCard_${ParkInfoDoc.id}`).remove();
					break;
			};
		});
	}, ErrorObject => {
		console.log(ErrorObject);
		CorrellationId=uuidv4();
		ErrorCode="PPERPKINFCDQU";
		bugsnagClient.notify(ErrorObject, {
			metaData: { CorrellationId: CorrellationId, ErrorCode: ErrorCode},
				severity: 'error'
                });
	});
};









function ParkClosingDisplayDateTime(ClosingDate) {
	Difference=moment(ClosingDate.toDate()).startOf('day').diff(moment().startOf('day'),'days');
	console.log(Difference);
	switch (Difference) {
		case 0:
			console.log("Today");
			ClosingDay="";
			ClosingTime=moment(ClosingDate.toDate()).format('HH:mm');
			break;
		case 1:
			console.log("Tomorrow");
			ClosingDay="Tomorrow";
			ClosingTime=moment(ClosingDate.toDate()).format('HH:mm');
			break;
		case 2:
		case 3:
		case 4:
		case 5:
		case 6:
			console.log("Upcoming weekday");
			ClosingDay=moment(ClosingDate.toDate()).format('dddd');
			ClosingTime=moment(ClosingDate.toDate()).format('HH:mm');
			break;
		default:
			console.log("Not tommrow");
			ClosingDay=moment(ClosingDate.toDate()).format('dddd Do MMMM YYYY');;
			ClosingTime=moment(ClosingDate.toDate()).format('HH:mm');
			break;
	};
	console.log(`Closes ${ClosingDay} at ${ClosingTime}`);
	return(`Closes ${ClosingDay} at ${ClosingTime}`);
};

function ParkOpeningClosingDisplayDateTime(OpeningDate,ClosingDate) {
	Difference=moment(OpeningDate.toDate()).startOf('day').diff(moment().startOf('day'),'days');
	console.log(Difference);
	switch (Difference) {
		case 0:
			console.log("Today");
			OpeningDay="Today";
			OpeningTime=moment(OpeningDate.toDate()).format('HH:mm');
			break;
		case 1:
			console.log("Tomorrow");
			OpeningDay="Tomorrow";
			OpeningTime=moment(OpeningDate.toDate()).format('HH:mm');
			break;
		case 2:
		case 3:
		case 4:
		case 5:
		case 6:
			console.log("Upcoming weekday");
			OpeningDay=moment(OpeningDate.toDate()).format('dddd');
			OpeningTime=moment(OpeningDate.toDate()).format('HH:mm');
			break;
		default:
			console.log("Not tommrow");
			OpeningDay=moment(OpeningDate.toDate()).format('dddd Do MMMM YYYY');;
			OpeningTime=moment(OpeningDate.toDate()).format('HH:mm');
			break;
	};

	Difference=moment(ClosingDate.toDate()).startOf('day').diff(moment().startOf('day'),'days');
	console.log(Difference);
	switch (Difference) {
		case 0:
			console.log("Today");
			ClosingDay="Today";
			ClosingTime=moment(ClosingDate.toDate()).format('HH:mm');
			break;
		case 1:
			console.log("Tomorrow");
			ClosingDay="Tomorrow";
			ClosingTime=moment(ClosingDate.toDate()).format('HH:mm');
			break;
		case 2:
		case 3:
		case 4:
		case 5:
		case 6:
			console.log("Upcoming weekday");
			ClosingDay=moment(ClosingDate.toDate()).format('dddd');
			ClosingTime=moment(ClosingDate.toDate()).format('HH:mm');
			break;
		default:
			console.log("Not tommrow");
			ClosingDay=moment(ClosingDate.toDate()).format('dddd Do MMMM YYYY');;
			ClosingTime=moment(ClosingDate.toDate()).format('HH:mm');
			break;
	};
	console.log(`Opens ${OpeningDay} ${OpeningTime}, Closes ${ClosingDay} ${ClosingTime}`);
	return(`Opens ${OpeningDay} ${OpeningTime}, Closes ${ClosingDay} ${ClosingTime}`);
};
