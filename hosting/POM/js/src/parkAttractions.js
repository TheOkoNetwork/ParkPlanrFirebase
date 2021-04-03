const Fuse = require("fuse.js").default;
const $ = window.$;

async function parkAttractionsLoadEdit(params) {
  if (!window.db) {
    console.log("DB not ready yet, unable to load park attraction edit");
    $("body").on("dbLoaded", function () {
      console.log("DB Loaded, loading park attraction edit");
      parkAttractionsLoadEdit(params);
    });
    return;
  }

  const parkId = params.parkId;
  console.log(`Loading park: ${parkId}`);
  const parkDoc = await window.db.collection("parks").doc(parkId).get();

  $("#rideEditFieldMiscLogo").on("change", function () {
    $("#rideEditFieldMiscLogoImg").attr("src", $(this).val());
  });

  if (!parkDoc.exists) {
    console.log(`Park with ID: ${parkId} does not exist`);
    window.alert("Park does not exist");
    window.router.navigate(window.router.generate("parks.list"));
    return;
  }
  const parkData = parkDoc.data();
  parkData.id = parkDoc.id;
  console.log(parkData);
  $(".parkName").text(parkData.name.name);

  if (params.rideId) {
    console.log("Edit ride");
    const rideId = params.rideId;
    console.log(`Loading ride: ${rideId}`);
    const rideDoc = await window.db
      .collection("parks")
      .doc(parkId)
      .collection("rides")
      .doc(rideId)
      .get();
    if (!rideDoc.exists) {
      console.log(`Ride with ID: ${rideId} does not exist`);
      window.alert("Ride does not exist");
      window.router.navigate(
        window.router.generate("park.attractions.list", { parkId: parkId })
      );
      return;
    }
    const rideData = rideDoc.data();
    rideData.id = rideDoc.id;
    console.log(rideData);
    $(".rideName").text(rideData.name.name);

    $("#rideEditFieldName").val(rideData.name.name);
    $("#rideEditFieldActive").prop("checked", rideData.active);
    $("#rideEditFieldMiscLogo").val(rideData.logo);
    $("#rideEditFieldMiscLogoImg").attr("src", rideData.logo);
    let ridecountcomAttractionIds;
    if (rideData.ridecountcomAttractionId) {
      ridecountcomAttractionIds = rideData.ridecountcomAttractionId.join(",");
    } else {
      ridecountcomAttractionIds = "";
    }
    $("#rideEditFieldMiscRidecountcomAttractionId").val(
      ridecountcomAttractionIds
    );

    $(".showIfRideAdd").hide();
    $(".showIfRideEdit").show();
  } else {
    console.log("New ride");
    $(".showIfRideAdd").show();
    $(".showIfRideEdit").hide();
  }

  $("#rideEditSaveButton").on("click", async function () {
    console.log("Save button clicked");
    // todo actually save ride
    const params = window.router.lastRouteResolved().params;
    const parkId = params.parkId;
    const rideId = params.rideId;
    // ride id will be undefined which is falsely if adding

    const rideName = $("#rideEditFieldName").val();
    const rideActive = $("#rideEditFieldActive").prop("checked");
    const rideLogo = $("#rideEditFieldMiscLogo").val();
    const ridecountcomAttractionId =
      $("#rideEditFieldMiscRidecountcomAttractionId")
        .val()
        .split(",")
        .map((x) => Number(x)) || window.firebase.firestore.FieldValue.delete();

    if (!rideName) {
      return window.alert("Ride name required");
    }
    if (!rideLogo) {
      return window.alert("Ride logo required");
    }

    if (rideId) {
      console.log("Saving existing ride");

      await window.db
        .collection("parks")
        .doc(parkId)
        .collection("rides")
        .doc(rideId)
        .update({
          "name.name": rideName,
          logo: rideLogo,
          active: rideActive,
          ridecountcomAttractionId: ridecountcomAttractionId,
        });
      // window.alert(`Successfully saved ride: ${rideName}`);
      window.router.navigate(
        window.router.generate("park.attractions.list", { parkId: parkId })
      );
    } else {
      console.log("Adding new ride");

      const docRef = window.db
        .collection("parks")
        .doc(parkId)
        .collection("rides")
        .doc();

      await docRef.set({
        name: {
          name: rideName,
        },
        logo: rideLogo,
        active: rideActive,
        ridecountcomAttractionId: ridecountcomAttractionId,
      });
      window.alert(`Successfully added ride: ${rideName}`);
      window.router.navigate(
        window.router.generate("park.attractions.list", { parkId: parkId })
      );
    }
  });
  $("#rideEditDeleteButton").on("click", async function () {
    console.log("Delete button clicked");
    const params = window.router.lastRouteResolved().params;
    const parkId = params.parkId;
    const rideId = params.rideId;
    if (confirm("Are you sure you wish to delete this ride?")) {
      await window.db.collection("parks").doc(parkId).collection("rides").doc(rideId).delete();
    console.log("Successfully deleted");
    window.router.navigate(
      window.router.generate("park.attractions.list", { parkId: parkId })
    );
  };
  });
}

async function parkAttractionsLoad(params) {
  if (!window.db) {
    console.log("DB not ready yet, unable to load park attractions");
    $("body").on("dbLoaded", function () {
      console.log("DB Loaded, loading park attractions");
      parkAttractionsLoad(params);
    });
    return;
  }

  const parkId = params.parkId;
  console.log(`Loading park: ${parkId}`);
  const parkDoc = await window.db.collection("parks").doc(parkId).get();
  if (!parkDoc.exists) {
    console.log(`Park with ID: ${parkId} does not exist`);
    window.alert("Park does not exist");
    window.router.navigate(window.router.generate("parks.list"));
    return;
  }
  const parkData = parkDoc.data();
  parkData.id = parkDoc.id;
  console.log(parkData);
  $(".parkName").text(parkData.name.name);

  console.log("Loading attractions");
  const attractionsDocs = await window.db
    .collection("parks")
    .doc(parkId)
    .collection("rides")
    .get();
  console.log("Got attractions docs");
  console.log(attractionsDocs);

  const attractions = [];
  attractionsDocs.forEach(function (attractionDoc) {
    const attraction = attractionDoc.data();
    attraction.id = attractionDoc.id;
    // name.name is the default name, planning on eventually having
    // name.EN name.DE etc...
    attraction.nameDefault = attraction.name.name;
    attractions.push(attraction);
  });
  console.log(attractions);

  console.log("Loading jsGrid");
  $("#attractionsJSGrid").jsGrid({
    height: "auto",
    width: "100%",

    sorting: true,
    filtering: true,
    paging: true,

    rowClick: function (args) {
      console.log("jsGrid row click");
      console.log(args);
      const parkId = window.router.lastRouteResolved().params.parkId;
      window.router.navigate(
        window.router.generate("park.attractions.edit", {
          parkId: parkId,
          rideId: args.item.id,
        })
      );
    },
    onPageChanged: function (args) {
      console.log("jsGrid Page changed");
      // loadItemImages()
    },
    onOptionChanged: function (args) {
      console.log("jsGrid On options changed");
      // loadItemImages()
    },
    fields: [
      { title: "ID", name: "id", type: "text", width: 100 },
      { title: "Name", name: "nameDefault", type: "text", width: 150 },
      {
        title: "Active",
        name: "active",
        type: "checkbox",
        width: 50,
        filtercss: "itemsjsGridActiveCheckbox",
      },
      {
        title: "Queue times",
        name: "queuetimes",
        type: "checkbox",
        width: 50,
        filtercss: "itemsjsGridActiveCheckbox",
      },
    ],
    controller: {
      data: attractions,
      loadData: function (filter) {
        console.log(Fuse);
        console.log("Loading data");
        console.log(filter);
        let filteredItems = $.grep(attractions, function (attraction) {
          if (typeof filter.active === "boolean") {
            if (filter.active !== attraction.active) {
              return false;
            }
          }
          return true;
        });
        console.log("Filtered by active");
        console.log(filteredItems);

        filteredItems = $.grep(filteredItems, function (park) {
          if (typeof filter.queuetimes === "boolean") {
            if (filter.queuetimes !== park.queuetimes) {
              return false;
            }
          }
          return true;
        });
        console.log("Filtered by queuetimes");
        console.log(filteredItems);

        if (filter.id) {
          const idFilterFuse = new Fuse(filteredItems, {
            keys: ["id"],
          });
          filteredItems = idFilterFuse.search(filter.id).map(function (item) {
            return item.item;
          });
        }
        console.log("Filtered by ID");
        console.log(filteredItems);

        if (filter.nameDefault) {
          const nameFilterFuse = new Fuse(filteredItems, {
            keys: ["nameDefault"],
          });
          filteredItems = nameFilterFuse
            .search(filter.nameDefault)
            .map(function (item) {
              return item.item;
            });
        }
        console.log("Filtered by name");
        console.log(filteredItems);
        return filteredItems;
      },
    },
  });
  $("#attractionsJSGrid").jsGrid("search");

  $("#newAttractionButton").on("click", function () {
    const parkId = window.router.lastRouteResolved().params.parkId;
    window.router.navigate(
      window.router.generate("park.attractions.new", { parkId: parkId })
    );
  });
}

export { parkAttractionsLoad, parkAttractionsLoadEdit };
