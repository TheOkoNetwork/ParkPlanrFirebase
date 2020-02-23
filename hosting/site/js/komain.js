var SmallCrispyShellCoveredChocolateCount=0;
var SmallCrispyShellCoveredChocolate = new Konami(function() {
	SmallCrispyShellCoveredChocolateCount++;
	if (SmallCrispyShellCoveredChocolateCount<3) {
		return;
	};
	console.log("Konami code triggered");
	location.href="/DefendTheTowers";
});

