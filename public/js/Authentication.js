AuthenticationReady=false;

function AuthenticationCheckStatus(User) {
	if (User) {
		console.log("Signed in");
		$('.Unauthenticated').hide();
		$('.Authenticated').show();
		$('.DisplayName').text(User.displayName);

		stateurl=location.href.split('?')[0].split('#')[0].split('/')
	        console.log(stateurl);
	        stateurl.splice(0,3);
	        console.log(stateurl);

		if (stateurl[0]=="signin" || stateurl[0]=="signup") {
			console.log("Fresh session, redirecting home");
			switchPage('/');
		};


		Template7.global.User=User;

		firebase.auth().currentUser.getIdTokenResult().then((idTokenResult) => {
                        console.log(idTokenResult.claims);
			if (idTokenResult.claims.Admin) {
				console.log("User is an admin, showing admin items");
				$('.Admin').show();
				Template7.global.User.Admin=true;
			} else {
				console.log("User is NOT an admin, hiding admin items");
				$('.Admin').hide();
				delete(Template7.global.User.Admin);
			};
		}).catch((ErrorObject) => {
			console.log("Error getting claims");
			console.log(ErrorObject);
			ShowFatalErrorPage(ErrorObject,"PPERAUTHIDC");
		});
	} else {
		console.log("Unauthenticated");
		$('.Unauthenticated').show();
		$('.Authenticated').hide();
		$('.Admin').hide();

		if (Template7) {
			if (Template7.global) {
				if (Template7.global.User) {
					delete(Template7.global.User);
				};
			};
        	};

	};
};
firebase.auth().onAuthStateChanged(function(User) {
	AuthenticationReady=true;
	AuthenticationCheckStatus(User);
});

function SigninEmail() {
	email=$('#input-email').val();
	password=$('#input-password').val();

	if (firebase.auth().currentUser) {
		location.href="/";
	};

	console.log(`Signing in with email: ${email}`);

	firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
		console.log("Error signing in with email and password");
		console.log(error);
		console.log(error.code);
		HandleFirebaseAuthenticationError("signing in with email and password",error);
	});
};

function SignupEmail() {
	email=$('#input-email').val();
	password=$('#input-password').val();

	if (firebase.auth().currentUser) {
		location.href="/";
	};

	console.log(`Signing up with email: ${email}`);

	firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
		console.log("Error signing up with email and password");
		console.log(error);
		console.log(error.code);
		HandleFirebaseAuthenticationError("signing up with email and password",error);
	});
};

function Signout() {
	console.log("Signing out");
	firebase.auth().signOut().then(function() {
		console.log("Signed out");
		switchPage('/');
	}).catch(function(ErrorObject) {
		console.log("Error signing out");
		console.log(Errorobject);
                ShowFatalErrorPage(ErrorObject,"PPERSGNOTFAIL");
	});
};



function HandleFirebaseAuthenticationError(actionText,error) {
	errorCode=error.code;

	console.log("Firebase authentication error");
	console.log(actionText,errorCode);
	showDefaultErrorDialog=true;
        switch(errorCode) {
		case "auth/user-disabled":
			errorMessage="Account disabled. Please contact a member of the team for more information";
			break;
		case "auth/invalid-email":
			errorMessage="Email address invalid, please check your email address and try again";
			break;
		case "auth/user-not-found":
			errorMessage="Account not found";
			break;
		case "auth/email-already-in-use":
			showDefaultErrorDialog=false;
			error={
				code: "auth/account-exists-with-different-credential",
				email: $('#input-email').val()
			};
			HandleFirebaseAuthenticationError(actionText,error);
			break;
		case "auth/account-exists-with-different-credential":
			showDefaultErrorDialog=false;

			switchPage('/signin');
			firebase.auth().fetchSignInMethodsForEmail(error.email).then(function(methods) {
				console.log(methods);
				switch(methods[0]) {
					case "password":
						$('#input-email').val(error.email);
						swal({
							title: `Whoops!`,
							text: "You need to use your password to sign in",
							type: "error",
							showCancelButton: false,
							showConfirmButton: true
						});
						break;
					case "facebook.com":
						swal({
							title: `Whoops!`,
							text: "You need to use your facebook account to sign in",
							type: "error",
							showCancelButton: true,
							showConfirmButton: true,
							confirmButtonText: "Sign in with facebook"
						},function() {
							SigninFacebook();
						});
						break;
					case "google.com":
						swal({
							title: `Whoops!`,
							text: "You need to use your google account to sign in",
							type: "error",
							showCancelButton: true,
							showConfirmButton: true,
							confirmButtonText: "Sign in with google"
						},function() {
							SigninGoogle();
						});
						break;
				};
			}).catch(function(error) {
				console.log(error);
			});
			break;
		case "auth/wrong-password":
			showDefaultErrorDialog=false;
			swal({
				title: `Error ${actionText}`,
				text: "Sorry, that password is incorrect",
				type: "error",
				showCancelButton: true,
				cancelButtonText: "OK",
				showConfirmButton: true,
				confirmButtonClass: "btn-danger",
				confirmButtonText: "I've lost my password"
			},function() {
				switchPage('/forgotpassword');
			});
			break;
                default:
				errorMessage=`An unknown error(${errorCode}) occured. Please report this to a member of the team`
				CorrellationId=uuidv4();
				ErrorCode="PPERRHFAEUNK";
				ErrorObject=new Error(errorMessage);
        			bugsnagClient.notify(ErrorObject, {
                			metaData: { CorrellationId: CorrellationId, ErrorCode: ErrorCode},
                			severity: 'error'
			        });
                        break;
        };

	if (showDefaultErrorDialog) {
		swal({
			title: `Error ${actionText}`,
			text: errorMessage,
			type: "error",
			showCancelButton: false,
			showConfirmButton: true
		});
	};
};


function SigninFacebook() {
	console.log("Loading facebook signin");
	var provider = new firebase.auth.FacebookAuthProvider();

	firebase.auth().signInWithRedirect(provider).then(function(result) {
		console.log(result);
	}).catch(function(error) {
		console.log("Sign in with facebook error");
		HandleFirebaseAuthenticationError(error);
	});
};

function SigninGoogle() {
	console.log("Loading google signin");
	var provider = new firebase.auth.GoogleAuthProvider();

	firebase.auth().signInWithRedirect(provider).then(function(result) {
		console.log(result);
	}).catch(function(error) {
		console.log("Sign in with google error");
		HandleFirebaseAuthenticationError(error);
	});
};


function fetchFirebaseAuthRedirectResult() {
	firebase.auth().getRedirectResult().then(function(result) {
		console.log(result);
	}).catch(function(error) {
		console.log(error);
		if (error.credential.signInMethod) {
	                HandleFirebaseAuthenticationError(`Signing in with ${error.credential.signInMethod}`,error);
		};
	});
};


function ResetPassword() {
	email=$('#input-email').val();
	console.log(`Triggering password reset email for: ${email}`);
	firebase.auth().sendPasswordResetEmail(email).then(function() {
		console.log("Password reset email success");
		swal({
			title: "Password reset email sent",
			text: `We have sent an email to ${email} with a link to reset your password`,
			type: "success",
			showCancelButton: false,
			showConfirmButton: true
		});
	}).catch(function(error) {
		console.log(error);
                HandleFirebaseAuthenticationError(`Sending password reset email`,error);
	});
};
