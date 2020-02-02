function InitAdminCMSPagesPage(CMSPageDoc) {
	if (stateurl[3]!="New") {
		if (!CMSPageDoc) {
			CMSPageDocID=stateurl[3];
			db.collection("CMSPages").doc(CMSPageDocID).get().then(function(CMSPage) {
				console.log(CMSPage);
				if (CMSPage.exists) {
					InitAdminCMSPagesPage(CMSPage);
				} else {
					Load404();
				};
			}).catch(function(ErrorObject) {
				console.log("Error fetching existing CMS page");
				console.log(ErrorObject);
				GenericError(ErrorObject,"PPERCMSPGDF");
			});
			return;
		};
	};

	console.log("Loading Editor.js");

	if (CMSPageDoc) {
		CMSPageData=CMSPageDoc.data().Content;
		if (typeof(CMSPageData)=="string") {
			CMSPageData=JSON.parse(CMSPageData);
		};

		console.log("Loading CMS page data");
		console.log(CMSPageData);

		$('#AdminCMSPagesTitle').val(CMSPageDoc.data().Title);
		$('#AdminCMSPagesSubTitle').val(CMSPageDoc.data().SubTitle);
		$('#AdminCMSPagesSLUG').val(CMSPageDoc.data().SLUG);
		$('#AdminCMSPagesPageH1').text(CMSPageDoc.data().Title);
		$('#AdminCMSPagesAddButton').hide();
		$('#AdminCMSPagesSaveButton').show();
		$('#AdminCMSPagesPublic-0').prop('checked',CMSPageDoc.data().Public);
	} else {
		CMSPageData={};
		$('#AdminCMSPagesAddButton').show();
		$('#AdminCMSPagesSaveButton').hide();
	};
	window.AdminCMSPagesEditor = new EditorJS({
		holder: 'AdminCMSPagesEditorDiv',
		placeholder: 'Hello World!',
		autofocus: true,
		data: CMSPageData,
		tools: {
			table: {
				class: Table,
				inlineToolbar: true
			},
			header: {
      				class: Header,
      				shortcut: 'CMD+SHIFT+H',
			},
			linkTool: {
				class: LinkTool,
				config: {
					endpoint: `${config.FirebaseFunctionsUrl}/EditorApiLinkFetch`
				}
			},
			raw: RawTool,
			image: {
				class: ImageTool,
				config: {
					uploader: {
						uploadByUrl(url) {
							return $.ajax({
								url: url,
								method: 'GET',
								xhrFields: {
									responseType: 'arraybuffer'
								},
								headers: { 'X-Requested-With': 'XMLHttpRequest' },
							}).then(function(file) {
								console.log("Fetched image");
								uint = new Uint8Array(file.slice(0,4));
								let bytes = []
								uint.forEach((byte) => {
									bytes.push(byte.toString(16))
								});
								hex = bytes.join('').toUpperCase();
								console.log(hex);
								switch(hex) {
									case '89504E47':
										Filetype="image/png";
										break;
							            	case '47494638':
										Filetype="image/gif";
										break;
							            	case 'FFD8FFDB':
        							    	case 'FFD8FFE0':
							            	case 'FFD8FFE1':
										Filetype="image/jpeg";
										break;
							            	default:
						        			console.log(`Unknown file magic number: ${hex}`);
										return {
											success: 0,
										};
								}
								console.log(Filetype);
								ImageID=db.collection("CMSImages").doc().id;

								metadata = {
									contentType: Filetype,
								};

								return firebase.storage().ref().child(`CMSImages/${ImageID}`).put(file,metadata).then(function(ImageSnapshot) {
									console.log('Uploaded file');
									console.log(ImageSnapshot);
									return ImageSnapshot.ref.getDownloadURL().then(function(url) {
										Url=url.split('&token')[0];
										console.log(`Got image URL: ${Url}`);
										return {
											success: 1,
											file: {
												url: Url
											}
										};
									}).catch(function(ErrorObject) {
										console.log("Error getting file url");
										console.log(ErrorObject);
										GenericError(ErrorObject,"PPERCMSPGIMUGU");
										return {
											success: 0
										};
									});
								}).catch(function(ErrorObject) {
									console.log("Error uploading file");
									console.log(ErrorObject);
									GenericError(ErrorObject,"PPERCMSPGIMUUP");
									return {
										success: 0
									};
								});
							}).catch(function(ErrorObject) {
								console.log("Error fetching image");
								console.log(ErrorObject);
								//This is NOT reported as the most likely reason for this error to be triggered is a cross origin configuration issue
								return {
									success: 0
								};
							});
						},
						uploadByFile(file){
							ImageID=db.collection("CMSImages").doc().id;
							return firebase.storage().ref().child(`CMSImages/${ImageID}`).put(file).then(function(ImageSnapshot) {
								console.log('Uploaded file');
								console.log(ImageSnapshot);
								return ImageSnapshot.ref.getDownloadURL().then(function(url) {
									Url=url.split('&token')[0];
									console.log(`Got image URL: ${Url}`);
									return {
										success: 1,
										file: {
											url: Url
										}
									};
								}).catch(function(ErrorObject) {
									console.log("Error getting file url");
									console.log(ErrorObject);
									GenericError(ErrorObject,"PPERCMSPGIMFGU");
									return {
										success: 0
									};
								});
							}).catch(function(ErrorObject) {
								console.log("Error uploading file");
								console.log(ErrorObject);
								GenericError(ErrorObject,"PPERCMSPGIMFUP");
								return {
									success: 0
								};
							});
						}
					}
				}
			},
			checklist: {
				class: Checklist,
				inlineToolbar: true,
			},
			list: {
				class: List,
				inlineToolbar: true,
			},
			embed: {
				class: Embed,
				inlineToolbar: true
			},
			quote: {
				class: Quote,
				inlineToolbar: true,
				shortcut: 'CMD+SHIFT+O',
				config: {
					quotePlaceholder: 'Enter a quote',
					captionPlaceholder: 'Quote\'s author',
				},
 				}
		}
	});
};

function AdminCMSPagesPageSave() {
	Title=$('#AdminCMSPagesTitle').val();
	SubTitle=$('#AdminCMSPagesSubTitle').val();
	SLUG=$('#AdminCMSPagesSLUG').val();
	Public=$('#AdminCMSPagesPublic-0').is(':checked');

	if (!Title) {
		console.log("Title missing");
		return;
	};
	if (!SLUG) {
		console.log("SLUG missing");
		return;
	};

	console.log("Fetching page block");
	AdminCMSPagesEditor.save().then(function(PageContent) {
		console.log(PageContent);
		if (stateurl[3]!="New") {
			CMSPageDoc=db.collection("CMSPages").doc(stateurl[3]);
		} else {
			CMSPageDoc=db.collection("CMSPages").doc();
		};

		CMSPageDoc.set({
			Public: Public,
			Content: JSON.stringify(PageContent),
			Title: Title,
			SubTitle: SubTitle,
			SLUG: SLUG,
			LastEditedByUser: firebase.auth().currentUser.uid
		}, {merge: true}).then(function(result) {
			console.log(`Saved page with doc ID: ${CMSPageDoc.id}`);
			switchPage(`/Admin/CMS/Pages/${CMSPageDoc.id}`);
		}).catch((ErrorObject) => {
			console.log('DB Saving failed: ', ErrorObject)
			GenericError(ErrorObject,"PPERCMSPGSVD");
		});
	}).catch((error) => {
		console.log('CMS Saving failed: ', error)
		GenericError(ErrorObject,"PPERCMSPGSVEJ");
	});
};




function InitAdminCMSPages() {
	console.log("Loading CMS pages");

	db.collection("CMSPages").orderBy("SLUG","asc").get().then(function(CMSPageDocs) {
		CMSPagesTableData=[];

		TemplateAdminCMSPageSLUG=$('#TemplateAdminCMSPageSLUG').html();
		CompiledTemplateAdminCMSPageSLUG=Template7.compile(TemplateAdminCMSPageSLUG);

		TemplateAdminCMSPageEditButton=$('#TemplateAdminCMSPageEditButton').html();
		CompiledTemplateAdminCMSPageEditButton=Template7.compile(TemplateAdminCMSPageEditButton);

		TemplateAdminCMSPageDeleteButton=$('#TemplateAdminCMSPageDeleteButton').html();
		CompiledTemplateAdminCMSPageDeleteButton=Template7.compile(TemplateAdminCMSPageDeleteButton);

		CMSPageDocs.forEach(function(CMSPageDoc) {
			CMSPage=CMSPageDoc.data();
			CMSPage.id=CMSPageDoc.id;
			console.log(CMSPage);
			if (CMSPage.Public) {
				PagePublic="Public";
			} else {
				PagePublic="Hidden";
			};

			PageEditButton=CompiledTemplateAdminCMSPageEditButton(CMSPage);
			PageDeleteButton=CompiledTemplateAdminCMSPageDeleteButton(CMSPage);

			CMSPageTableRow=[
				CompiledTemplateAdminCMSPageSLUG(CMSPage),
				CMSPage.Title,
				PagePublic,
				PageEditButton,
				PageDeleteButton
			];
			CMSPagesTableData.push(CMSPageTableRow);
		});

		$('#AdminCMSPagesTable').DataTable({
			data: CMSPagesTableData
		});
	}).catch(function(ErrorObject) {
		GenericError(ErrorObject,"PPERADMPGSGET");
	});
};


function AdminCMSPagesDelete(PageID,ConfirmDelete) {
	if (PageID) {
		db.collection("CMSPages").doc(PageID).get().then(function(CMSPageDoc) {
			CMSPage=CMSPageDoc.data();
			CMSPage.id=CMSPageDoc.id;

			$('#AdminCMSPagesDeleteModal').modal();
			$('#AdminCMSPagesDeleteModal').data('PageID',PageID);
			$('#AdminCMSPagesDeleteModalPageSLUG').text(CMSPage.SLUG);
			$('#AdminCMSPagesDeleteModalPageTitle').text(CMSPage.Title);
			$('#AdminCMSPagesDeleteModalPageSubTitle').text(CMSPage.SubTitle);
		}).catch(function(error) {
			GenericError(ErrorObject,"PPERCMSADMDEL");
		});
		return;
	};
	PageID=$('#AdminCMSPagesDeleteModal').data('PageID');
	console.log(`Deleting page: ${PageID}`);

	db.collection("CMSPages").doc(PageID).delete().then(function() {
		console.log("Deleted page");
		$('#AdminCMSPagesDeleteModal').modal('hide');
		switchPage('/Admin/CMS/Pages');
	}).catch(function(error) {
		GenericError(ErrorObject,"PPERCMSADMDEL");
	});
};
