function InitAdminParksPage() {
	db.collection("ParkSubmissions").get().then(function(ParkSubmissions) {
		SubmissionCount=ParkSubmissions.docs.length;
		if (SubmissionCount) {
			console.log("At least one park submission");
			$('#AdminParksUserSubmissionsBtn').show();
		} else {
			$('#AdminParksUserSubmissionsBtn').hide();
		};
	}).catch(function(ErrorObject) {
		console.log("Failed to get park submissions");
		CorrellationId=uuidv4();
		ErrorCode="PPERRADMPKSUB";
		bugsnagClient.notify(ErrorObject, {
			metaData: { CorrellationId: CorrellationId, ErrorCode: ErrorCode},
			severity: 'error'
		});
	});

	db.collection("Parks").orderBy("Name","asc").get().then(function(ParkDocs) {
		TemplateAdminParksPark=$('#TemplateAdminParksPark').html();
		CompiledTemplateAdminParksPark=Template7.compile(TemplateAdminParksPark);

		$('#AdminParksDiv').empty();
		ParkDocs.forEach(function(ParkDoc) {
			console.log(ParkDoc);
			Park=ParkDoc.data();
			Park.ID=ParkDoc.id;

			$('#AdminParksDiv').append(CompiledTemplateAdminParksPark(Park));
		});
	}).catch(function(ErrorObject) {
		ShowFatalErrorPage(ErrorObject,"PPADMPKDFCA");
	});
};


SubmissionStatusDescriptions={
	0: "Pending review",
	1: "Rejected",
	2: "Approved"
};
SubmissionStatusReasons={
	"PARKEXISTS": "Park already added.",
	"DUPLICATESAMEUSER": "Duplicate of another submission by this user.",
	"DUPLICATEOTHERUSER": "Duplicate of a submission by another user.",
	"SPAM": "API flagged spam",
	"SPAMADM": "Manually flagged as spam",
	"TOS": "TOS violation",
	"LEGAL": "Legal reasons.",
	"APPROVEDTODO": "Approved, TODO",
	"APPROVEDINPROGRESS": "Approved-Working on",
	"APPROVEDADDED": "Approved-Added",
	"ADMINNEEDINFO": "Need information from user"
};

function InitAdminParksSubmissionsPage() {
	db.collection("ParkSubmissions").get().then(function(ParkSubmissions) {
		if (!ParkSubmissions.docs.length) {
			console.log("No park submissions pending approval");
			return;
		};

		TemplateAdminParkSubmission=$('#TemplateAdminParkSubmission').html();
		CompiledTemplateAdminParkSubmission=Template7.compile(TemplateAdminParkSubmission);

		ParkSubmissions.forEach(function(ParkSubmission) {
			Submission=ParkSubmission.data();
			Submission.id=ParkSubmission.id;

			if (SubmissionStatusDescriptions[Submission.Status]) {
				Submission.StatusDescription=SubmissionStatusDescriptions[Submission.Status];
			} else {
				Submission.StatusDescription="*Unknown status*";
			};
			console.log(Submission);
			$('#AdminParksSubmissionsDiv').append(CompiledTemplateAdminParkSubmission(Submission));
		});
	}).catch(function(ErrorObject) {
		console.log("Failed to get park submissions");
	});
};

function AdminParkSubmissionReject() {
	$('#AdminParkSubmissionRejectModal').modal();
};



function InitAdminParksNewPage() {
	$("#AdminParkNewCountry").countrySelect({
		defaultCountry: "gb",
		preferredCountries: ['gb', 'us', 'ca', 'de'],
		responsiveDropdown: true
	});
};



function AdminParkNewSubmit() {
	Park={
		Name: $('#AdminParkNewName').val(),
		ParkCode: $('#AdminParkNewParkCode').val(),
		Website: $('#AdminParkNewWebsiteURL').val(),
		Logo: $('#AdminParkNewLogoURL').val(),
		Country: $('#AdminParkNewCountry_code').val().toUpperCase(),
		Active: false,
		Queuetimes: false,
		Ridecount: false,
		OpeningTodayLastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
		Created: firebase.firestore.FieldValue.serverTimestamp()
	};

	MapURL=$('#AdminParkNewMapURL').val();
	if (MapURL) {
		console.log("Map URL provided, flagging as Maps true");
		Park.Map=MapURL;
		Park.Maps=true;
	};

	if (!Park.Name) {
		console.log("Park name must be provided");
		return;
	};
	if (!Park.ParkCode) {
		console.log("A park code must be provided");
		return;
	};
	if (!Park.Logo) {
		console.log("A park logo URL must be provided");
		return;
	};

	db.collection("Parks").where("ParkCode","==",Park.ParkCode).get().then(function(ParkDocs) {
		if (ParkDocs.empty) {
			console.log("No existing park with that park code found");
			DocRef=db.collection("Parks").doc();
			DocRef.set(Park).then(function() {
				console.log(`Park created: ${DocRef.id}`);
				switchPage(`/Admin/Parks/${DocRef.id}`);
			}).catch(function(ErrorObject) {
				GenericError(ErrorObject,"PPERADMPKADF");
			});
		} else {
			ExistingParkCodeDoc=ParkDocs.docs[0];
			console.log(`Duplicate park code, ${Park.ParkCode} is in use by ${ExistingParkCodeDoc.data().Name} (ID: ${ExistingParkCodeDoc.id})`);
		};
	}).catch(function(ErrorObject) {
		GenericError(ErrorObject,"PPERADMPKPKCHKF");
	});


};
