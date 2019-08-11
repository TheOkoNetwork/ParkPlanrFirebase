AuthenticationReady=false;

function AuthenticationCheckStatus(user) {
	if (user) {
		console.log("Signed in");
		$('.Unauthenticated').hide();
		$('.Authenticated').show();
	} else {
		console.log("Unauthenticated");
		$('.Unauthenticated').show();
		$('.Authenticated').hide();
	};
};
firebase.auth().onAuthStateChanged(function(user) {
	AuthenticationReady=true;
	AuthenticationCheckStatus(user);
});
