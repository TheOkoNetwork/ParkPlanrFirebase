firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      $('.currentUsername').text(user.displayName);
      $('.userProfileImage').prop('src',user.photoURL);
    } else {
      console.log('Unauthenticated')
      window.location="/signin";
    }
  })

