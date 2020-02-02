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


};
