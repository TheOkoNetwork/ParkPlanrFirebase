function FetchHeaderParks() {
	db.collection("Parks").where("Active","==",true).orderBy("Name","asc").get().then(function(ParkDocs) {
		$('#HeaderParksDropdown').empty();
		TemplateHeaderParksDropdown=$('#TemplateHeaderParksDropdown').html();
		if (!TemplateHeaderParksDropdown) {
			return;
		};
		CompiledTemplateHeaderParksDropdown=Template7.compile(TemplateHeaderParksDropdown);
		ParkDocs.forEach(function(ParkDoc) {
			console.log(ParkDoc.data());
			$('#HeaderParksDropdown').append(CompiledTemplateHeaderParksDropdown(ParkDoc.data()));
	    });
	}).catch(function(error) {
		console.log("Error fetching parks");
		console.log(error);
		CorrellationId=uuidv4();
                ErrorCode="PPERRHDRPRK";
                bugsnagClient.notify(ErrorObject, {
			metaData: { CorrellationId: CorrellationId, ErrorCode: ErrorCode},
			severity: 'error'
		});
	});
};
