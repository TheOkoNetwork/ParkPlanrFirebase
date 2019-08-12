function FetchParkInfoCards() {
	TemplateParkInfoCard=$('#TemplateParkInfoCard').html();
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
					}, error => {
						//TODO add bugsnag
						console.log(error);
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
	}, err => {
		//TODO add bugsnag
		console.log(error);
	});
};
