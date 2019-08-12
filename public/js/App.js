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
			case "filterForm":
				init_FilterForm();
				break;
			case "header":
				if (firebase.app().options.projectId==config.firebaseBetaEnviromentProject) {
					$('#headerBetaEnviroment').show();
				};
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
		bugsnagClient.notify(error);
		showFatalErrorPage(error);
	};
	}).fail(function(error) {
		console.log("Failed loading fragment");
		bugsnagClient.notify(error);
		console.log(error);
	});
};


function loadPage(page) {
	$.get(`/pages/${page}.html`, function(data) {
		try {
			isPage=data.startsWith("<!-- PAGE CONTENT-TAG_ID -->");
			if (!isPage) {
				console.log("Page HTML file not found");
				Load404();
				return;
			};

			$(`#main`).html(data);
			$('.CurrentYear').text(new Date().getFullYear());
			AuthenticationCheckStatus(firebase.auth().currentUser);

			switch (page) {
				case "index":
					FetchParkInfoCards();
					break;
				case "signin":
					init_firebase_auth_ui();
					break;
			};
		} catch (error) {
			console.log(error);
			bugsnagClient.notify(error);
			showFatalErrorPage(error);
		};
	}).fail(function(error) {
		console.log("Failed loading page");
		console.log(error);
		bugsnagClient.notify(error);
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
			showFatalErrorPage("Authentication ready timeout reached");
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
	stateurl=location.href.replace('#','').split('/')
        console.log(stateurl);
        stateurl.splice(0,3);
        console.log(stateurl);

        switch (stateurl[0]) {
		case "":
                        console.log("Loading Index page");
                        loadPage('index');
                        break;
	};
};


function loadPageTag(element) {
	console.log(element);
	pageUrl=$(element).attr('href');
	pushstate(null,pageUrl,false,config.SiteDefaultTitle);
};


function switchPage(pageUrl) {
	pushstate(null,pageUrl,false,onfig.SiteDefaultTitle);
};

//Template7.registerHelper('loadFragment', function (fragment) {
//	return `<script id="${fragment}_Holder">LoadFragment('${fragment}');</script>`;
//});
