Template7.global={};

function LoadFragment(fragment) {
	$.get(`/fragments/${fragment}.html`, function(data) {
		try {
			isFragment=data.startsWith("<!-- FRAGMENT CONTENT-TAG_ID -->");
			if (!isFragment) {
				console.log("Fragment HTML file not found");
				Load404();
				return;
			};
			$(`#${fragment}_Holder`).replaceWith(data);
			$('.CurrentYear').text(new Date().getFullYear());
			AuthenticationCheckStatus(firebase.auth().currentUser);

			switch (fragment) {
				case "header":
					if (firebase.app().options.projectId==config.firebaseBetaEnviromentProject) {
						$('#headerBetaEnviroment').show();
					};
					FetchHeaderParks();
					break;
				case "locationsTableFAQ":
					fetchLocationsTableFAQ();
					break;
				case "footer":
					$('#footerFirebaseProjectId').text(firebase.app().options.projectId);
					$('#footerVersion').text(config.version);
					break;
			};
		} catch (error) {
			console.log(error);
			ShowFatalErrorPage(Error,"PPERFRGCA");
		};
	}).fail(function(error) {
		console.log(error);
		ShowFatalErrorPage(Error,"PPERFRGLD");
	});
};


function loadPage(page) {
	$.get(`/pages/${page}.html`, function(data) {
		try {
			isPage=data.startsWith("<!-- PAGE CONTENT-TAG_ID -->");
			isStandalonePage=data.startsWith("<!-- STANDALONE PAGE CONTENT-TAG_ID -->");
			if (!isPage && !isStandalonePage) {
				console.log("Page HTML file not found");
				Load404();
				return;
			};

			//loads the page content into the dom
			if (isPage) {
				if (!$('#main').length) {
					console.log("Switching from standalone page, loading standard page core layout");
					$('#body').html('<script id="header_Holder">LoadFragment("header");</script><main id="main"></main><script id="footer_Holder">LoadFragment("footer");</script>');
				};
				$(`#main`).html(data);
			} else {
				$(`body`).html(data);
			};
			//updates any tags with the class CurrentYear with the YYYY year
			$('.CurrentYear').text(new Date().getFullYear());
			//scrolls back to the top of the window
			window.scrollTo(0,0);
			//triggers checks for authentication status (hides/shows various classes)
			AuthenticationCheckStatus(firebase.auth().currentUser);

			switch (page) {
				case "index":
					FetchParkInfoCards();
					break;
				case "CMS":
					RenderCMSPage();
					break;
				case "signin":
					fetchFirebaseAuthRedirectResult();
					break;
				case "ridecount":
					initRidecountPage();
					break;
				case "ridecount/user":
					InitRidecountUserPage();
					break;
				case "Admin/Parks":
					InitAdminParksPage();
					break;
				case "Admin/Parks/Submissions":
					InitAdminParksSubmissionsPage();
					break;
				case "Admin/Parks/New":
					InitAdminParksNewPage();
					break;
				case "Admin/CMS/Pages/Page":
					InitAdminCMSPagesPage();
					break;
				case "Admin/CMS/Pages":
					InitAdminCMSPages();
					break;
			};
		} catch (error) {
			console.log(error);
			ShowFatalErrorPage(error,"PPERPGCA");
		};
	}).fail(function(error) {
		console.log(error);
		ShowFatalErrorPage(error,"PPERPGLD");
	});
};




window.addEventListener("popstate", function(event){
        console.log(event);
        pushstate(event.state,"",location.href,true);
});
$(document).ready(function() {
        pushstate({},location.href,true);
});

function pushstate(state,url,eventonly,title=config.SiteDefaultTitle) {
        //event only skips the actual history.pushState, used for running the page logic on load
        if (!eventonly) {
                console.log("Pushing state");
                history.pushState(state,title,url);
        };

	if (typeof(AuthenticationReadyFailCount)=="undefined") {
		window.AuthenticationReadyFailCount=0;
	};

	if (AuthenticationReadyFailCount >= 500) {
		console.log("Authentication ready timeout");
		setTimeout(function() {
			ShowFatalErrorPage(Error("Authentication ready timeout reached"),"PPSTAARTO");
		}, 1500);
		return;
	};
	if (typeof(AuthenticationReady)=="undefined") {
		console.log("Authentication not ready-var not found");
		AuthenticationReadyFailCount++;
		console.log(AuthenticationReadyFailCount);
		setTimeout(function() {
			console.log("Attempting to push state again");
			pushstate(state,url,true,title);
		}, 250);
		return;
	};
	if (!AuthenticationReady) {
		console.log("Authentication not ready-false");
		AuthenticationReadyFailCount++;
		console.log(AuthenticationReadyFailCount);
		setTimeout(function() {
			console.log("Attempting to push state again");
			pushstate(state,url,true,title);
		}, 250);
		return;
	};
	stateurl=location.href.split('?')[0].split('#')[0].split('/')
        console.log(stateurl);
        stateurl.splice(0,3);
        console.log(stateurl);

        switch (stateurl[0]) {
		case "":
                        console.log("Loading Index page");
                        loadPage('index');
                        break;
		case "about":
                        console.log("Loading About page");
                        loadPage('about');
                        break;
		case "CIMonitoring":
                        console.log("Loading CI Monitoring page");
                        loadPage('CIMonitoring');
                        break;
		case "Admin":
			console.log("Admin page");
			if (firebase.auth().currentUser) {
				firebase.auth().currentUser.getIdTokenResult().then((idTokenResult) => {
		                        console.log(idTokenResult.claims);
		                        if (idTokenResult.claims.Admin) {
		                                console.log("User is an admin, allowing access");
						if (stateurl[1]) {
							switch (stateurl[1]) {
								case "CMS":
									console.log("Admin CMS url");
									if (stateurl[2]) {
										switch (stateurl[2]) {
											case "Pages":
												console.log("Pages url");
												if (stateurl[3]) {
													switch (stateurl[3]) {
														case "New":
															console.log("New page");
									                        			loadPage('Admin/CMS/Pages/Page');
															break;
														default:
															console.log("Edit page");
									                        			loadPage('Admin/CMS/Pages/Page');
													};
												} else {
													console.log("All pages");
							                        			loadPage('Admin/CMS/Pages');
												};
												break;
											default:
												console.log(`Unknown second fragment: ${stateurl[2]}`);
												LoadCMS();
										};
									} else {
										console.log("CMS root page");
							                        loadPage('Admin/CMS');
									};
									break;
								case "Parks":
									console.log("Admin parks url");
									if (stateurl[2]) {
										switch (stateurl[2]) {
											case "Submissions":
												console.log("Submissions url");
						                        			loadPage('Admin/Parks/Submissions');
												break;
											case "New":
												console.log("New url");
						                        			loadPage('Admin/Parks/New');
												break;
											default:
												console.log("Park specific url");
						                        			loadPage('Admin/Parks/Park');
										};
									} else {
										console.log("All parks");
							                        loadPage('Admin/Parks');
									};
									break;
								default:
									LoadCMS();
								};
						} else {
							LoadCMS();
						};
		                        } else {
		                                console.log("User is NOT an admin, redirecting home");
						switchPage('/');
		                        };
		                }).catch((Error) => {
		                        console.log("Error getting claims");
		                        console.log(Error);
					ShowFatalErrorPage(Error,"PPERADMIDC");
		                });
			} else {
				console.log("Unauthenticated, redirecting home");
				switchPage('/');
			};
			break;
		case "ridecount":
                        if (stateurl[1]) {
	                        if (stateurl[2]) {
					console.log("Loading Ride count trip page");
        	                	loadPage('ridecount/trip');
				} else {
					console.log("Loading Ride count user page");
        	                	loadPage('ridecount/user');
				};
			} else {
				console.log("Loading Ride count page");
                        	loadPage('ridecount');
			};
                        break;
		case "signin":
			if (firebase.auth().currentUser) {
				console.log("Already signed in, redirecting to home");
				switchPage('/');
			} else {
	                        console.log("Loading Signin page");
        	                loadPage('signin');
			};
                        break;
		case "forgotpassword":
			if (firebase.auth().currentUser) {
				console.log("Already signed in, redirecting to home");
				switchPage('/');
			} else {
	                        console.log("Loading forgot password page");
        	                loadPage('forgotpassword');
			};
                        break;
		case "signup":
			if (firebase.auth().currentUser) {
				console.log("Already signed in, redirecting to home");
				switchPage('/');
			} else {
	                        console.log("Loading Signup page");
        	                loadPage('signup');
			};
                        break;
		case "submitPark":
			if (stateurl[1]) {
				if (stateurl[1]=="thanks") {
		                        console.log("Loading submit park thanks page");
	       		                loadPage('submitParkThanks');
				} else {
					console.log(`Unknown submitPark 2nd stateurl fragment: ${stateurl[1]}`);
					LoadCMS();
				};
			} else {
	                        console.log("Loading submit park page");
       		                loadPage('submitPark');
			};
                        break;
		case "parks":
                        if (stateurl[1]) {
	                        if (stateurl[2]) {
					console.log("Specific park sub page");
					LoadCMS();
				} else {
					console.log("Loading park information page");
        	                	loadPage('parks/park');
				};
			} else {
				console.log("Loading park list page");
                        	loadPage('parks');
			};
                        break;
		default:
			LoadCMS();
	};
};


function loadPageTag(element) {
	console.log(element);
	pageUrl=$(element).attr('href');
	pushstate(null,pageUrl,false,config.SiteDefaultTitle);
	if ($('#navbar_global').find('.collapse-close').is(':visible')) {
		console.log("Nav bar needs collapsing");
		$('#navbar_global').find('.collapse-close').find('a').click();
	};
};


function switchPage(pageUrl) {
	pushstate(null,pageUrl,false,config.SiteDefaultTitle);
};

function Load404() {
	console.log("Loading 404 page");
	loadPage('404');
};

//Template7.registerHelper('loadFragment', function (fragment) {
//	return `<script id="${fragment}_Holder">LoadFragment('${fragment}');</script>`;
//});

function ShowFatalErrorPage(ErrorObject,Code) {
	if (!Code) {
		Code="PPERFATAL";
	};

	console.log("***** Fatal Error *****");
	console.log(ErrorObject);
	console.log(Code);
	console.log("***** Fatal Error *****");

	CorrellationId=uuidv4();
        bugsnagClient.notify(ErrorObject, {
		metaData: { CorrellationId: CorrellationId, ErrorCode: Code},
                severity: 'error'
	});


	//location.href="/VeryBadError";
};


function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};



function GenericError(ErrorObject,Code) {
	$('#GenericError').modal();
	$('#GenericErrorErrorCode').text(Code);

	console.log(ErrorObject);
	console.log(Code);
	CorrellationId=uuidv4();

        bugsnagClient.notify(ErrorObject, {
		metaData: { CorrellationId: CorrellationId, ErrorCode: Code},
                severity: 'error'
	}, function (ErrorObject, report) {
		if (ErrorObject) {
			console.log('Failed to send report because of:\n' + ErrorObject.stack)
			ShowFatalErrorPage(ErrorObject,"PPGENERBSNER");
			$('#GenericErrorCorrellationId').text("Please wait");
		} else {
			console.log('Successfully sent report "' + report.errorMessage + '"')
			$('#GenericErrorCorrellationId').text(CorrellationId);
		};
	});
};


function LoadCMS(ShowHiddenPages) {
	SLUG=stateurl.join('/');
	db.collection("CMSPages").where("SLUG","==",SLUG).where("Public","==",true).get().then(function(CMSPages) {
		if (CMSPages.empty) {
			console.log(`No CMS page for SLUG: ${SLUG} found`);
			if (firebase.auth().currentUser) {
				firebase.auth().currentUser.getIdTokenResult().then((idTokenResult) => {
                        		console.log(idTokenResult.claims);
                        		if (idTokenResult.claims.Admin) {
						if (ShowHiddenPages) {
							console.log("Admin but already tried loading hidden page, loading 404");
							return Load404();
						} else {
							console.log("Admin, attempting to load hidden page");
							return LoadCMS(true);
						};
                        		} else {
						console.log("Not Admin, loading 404");
						return Load404();
                        		};
		                }).catch((ErrorObject) => {
        		                console.log("Error getting claims");
        		                console.log(ErrorObject);
        		                ShowFatalErrorPage(ErrorObject,"PPERCMSLDIDC");
                		});
			} else {
				console.log("Unauthenticated, loading 404");
				return Load404();
			};
		} else {
			if (CMSPages.docs.length>1) {
				console.log("**Duplicate CMS page SLUG's found");
			        bugsnagClient.notify(ErrorObject, {
					metaData: { SLUG: SLUG, ErrorCode: "PPERCMSLDDUP"},
	        		        severity: 'error'
				});
			};
			window.CMSPageDoc=CMSPages.docs[0];
			console.log("CMS Page found");
			console.log(CMSPageDoc);
			loadPage('CMS');
		};
	}).catch(function(ErrorObject) {
		ShowFatalErrorPage(ErrorObject,"PPERCMSLDCA");
	});
};











Template7.registerHelper('switch', function (value, options) {
    this._switch_value_ = value;
    this._switch_break_ = false;
    let html = options.fn(this);
    delete this._switch_break_;
    delete this._switch_value_;
    return html;
});
Template7.registerHelper('case', function (value, options) {
    let args = Array.prototype.slice.call(arguments);
    options = args.pop();
    let caseValues = args;

    if (this._switch_break_ || caseValues.indexOf(this._switch_value_) === -1) {
        return '';
    } else {
        this._switch_break_ = true;
        return options.fn(this);
    }
});

Template7.registerHelper('default', function (options) {
    if (!this._switch_break_) {
        return options.fn(this);
    } else {
        return '';
   }
});
