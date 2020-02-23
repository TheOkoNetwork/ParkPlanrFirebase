function SubmitParkNextName() {
	ParkName=$('#SubmitParkName').val();

	if (!ParkName) {
		console.log("Park name empty or not provided");
		$('#SubmitParkNameRequiredError').modal();
		$('#SubmitParkSectionWebsite').hide();
	} else {
		console.log("Park name provided");
		$('#SubmitParkSectionWebsite').show();
		$("html, body").animate({
		    scrollTop: $('#SubmitParkSectionWebsite').offset().top
		  }, 1000);
	};
};


function SubmitParkNextWebsite() {
	if (firebase.auth().currentUser) {
		console.log("User is signed in, bypassing email input box");
		$('#SubmitParkUserEmail').val(firebase.auth().currentUser.email);
		$('#SubmitParkUserEmail').val(firebase.auth().currentUser.email).attr('disabled',true);
		$('#SubmitParkSectionUserEmail').hide();

		$('#SubmitParkSectionAdditionalInformation').show();
		$("html, body").animate({
		    scrollTop: $('#SubmitParkSectionAdditionalInformation').offset().top
		  }, 1000);
	} else {
		console.log("User is unauthenticated, showing email input box");
		$('#SubmitParkSectionUserEmail').show();
		$("html, body").animate({
		    scrollTop: $('#SubmitParkSectionUserEmail').offset().top
		  }, 1000);
	};

};

function SubmitParkNextEmail() {
	$('#SubmitParkSectionAdditionalInformation').show();
	$("html, body").animate({
	    scrollTop: $('#SubmitParkSectionAdditionalInformation').offset().top
	}, 1000);
};

function SubmitParkNextAdditionalInformation() {
	SubmitParkSubmit();
};


function SubmitParkSubmit() {
	console.log("Park submission triggered");
	ParkName=$('#SubmitParkName').val();
	ParkWebsite=$('#SubmitParkWebsite').val();
	UserEmail=$('#SubmitParkUserEmail').val()
	AdditionalInformation=$('#SubmitParkAdditionalInformation').val();

	if (!ParkName) {
		console.log("Park name empty or not provided");
		$('#SubmitParkNameRequiredError').modal();
		$('#SubmitParkSectionWebsite').hide();
		$('#SubmitParkSectionUserEmail').hide();
		$('#SubmitParkSectionAdditionalInformation').hide();
		$("html, body").animate({
		    scrollTop: $('#SubmitParkSectionName').offset().top
		}, 1000);
	};

	SubmissionData={
		Park: {
			Name: ParkName,
			Website: ParkWebsite
		},
		Submitter: {
			Email: UserEmail
		},
		AdditionalInformation: AdditionalInformation,
		SubmissionTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
		Status: 0
	};
	if (firebase.auth().currentUser) {
		SubmissionData.Submitter.uid=firebase.auth().currentUser.uid;
	};
	console.log(SubmissionData);

	db.collection("ParkSubmissions").doc().set(SubmissionData).then(function(SubmissionData) {
		console.log("Submitted park");
		switchPage('/submitPark/thanks');
	}).catch(function(ErrorObject) {
		console.log("Error submitting park");
		console.log(ErrorObject);
		//ERROR: #PPERPKSUCA
		$('#SubmitParkSubmissionError').modal();

		CorrellationId=uuidv4();
		$('#SubmitParkSubmissionErrorCorrellationId').text(CorrellationId);

		bugsnagClient.notify(Error, {
			metaData: { CorrellationId: CorrellationId, SubmissionData: SubmissionData},
			severity: 'error'
		})
	});
};
