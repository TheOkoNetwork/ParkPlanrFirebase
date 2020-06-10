const fetch = require('node-fetch')
const createHttpLink = require('apollo-link-http').createHttpLink
const InMemoryCache = require('apollo-cache-inmemory').InMemoryCache
const ApolloClient = require('apollo-client').ApolloClient
const gql = require('graphql-tag')

const admin = require('firebase-admin')

const open = require('open');
const player = require('play-sound')()


var dev = true
if (dev) {
  var serviceAccount = require("../serviceAccountKey_Dev.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://parkplanr-dev.firebaseio.com"
  });
} else {
  console.log("***** P R O D U C T I O N ******");
  var serviceAccount = require("../serviceAccountKey_Production.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://fir-parkplanr.firebaseio.com"
  });
};

const db = admin.firestore();




var allParks=[]
var allDbParks={};
var allRides=[];

async function getData(page) {
    const client = new ApolloClient({
      link: createHttpLink({
        fetch: fetch,
        uri: "https://oci.coaster.cloud/graphql/v1",
      }),
      cache: new InMemoryCache(),
    })
    try {
      const result =  await client.query({
        query: gql`
        query {
          parkCollection(page:${page},filter: {type: ["themepark"]}) {
            parks {
              id,
              name,
              slug,
              web,
              types {key},
              images { id, small, middle, large, attribution {text}, license {label,url}},
              state { key, label(locale: "en") },
              address {street,houseNumber,city,postalCode,province,country {key}},
              latitude,
              longitude,
              attractionCollection {
                attractions {
                  id,
                  name,
                  category { key, label(locale: "en") }
                }
              }
            }
          }
        }`
      })
      var parks = result.data.parkCollection.parks;
      console.log(`Fetched: ${parks.length} parks`);

      if (parks.length) {
        allParks = allParks.concat(parks)
        page++
        getData(page)
      } else {
        console.log(`Fetched total of: ${allParks.length} parks`);
        processParks(0);
      };
    }
    catch (error) {
      console.log(error);
    }
    }

async function processParks(counter) {
  park=allParks[counter];
  if (!park) {
    console.log("Processed all parks");
    processRides(0);
    return;
  };

  var dbParkQuery = await db.collection("parks").where("coasterCloudID","==",park.id).limit(1).get();
  if (dbParkQuery.empty) {
    console.log(`${park.name} does not exist, creating`);

    if (!park['attractionCollection']['attractions'].length) {
      console.log("Park has no attractions");
      counter++;
      processParks(counter);
      return;
    };

    if (!park.address.country) {
      console.log("Park missing country");
      console.log(park);

      var skipParkIds=[
        //Wildlands
        'da91d1a1-d564-40a4-a9bd-5883d429b9f3',
        //Ok Corral
        '6c72e45f-2882-407a-ac2d-6529faba77ec',
        //Happyland
        'fbaee181-312f-4b55-bbeb-0d51a9f6944b',
        //Holiday World - Wooland Fun Park
        'ce6d48df-e492-417a-8493-fefe11101ad7'
      ]

      if (skipParkIds.includes(park.id)) {
        console.log("Skipping park")
        counter++;
        processParks(counter);
        return;
      };

      console.log(`${counter+1}/${allParks.length}`);


      player.play('./sound.mp3');
      await open(`https://coaster.cloud/parks/${park.slug}`);
      await open(`https://www.google.com/maps?q=${park.name}`);
      //await open(`https://www.mapcoordinates.net/en`);
      await open(`https://www.google.com/search?q=${park.name}`);
      process.exit();
      return;
    };

    var newDbParkData={
      coasterCloudID: park.id,
      creationSource: "coasterCloud_pending",
      active: false,
      location: {
        coordinates: {
          latitude: Number(park.latitude),
          longitude: Number(park.longitude)
        },
        address: {
          addr1: park.address.houseNumber,
          addr2: park.address.street,
          city: park.address.city,
          postalCode: park.address.postalCode,
          state: park.address.province,
          country: park.address.country.key
        }
      },
      created: admin.firestore.FieldValue.serverTimestamp(),
      updated: admin.firestore.FieldValue.serverTimestamp(),
      maps: false,
      name: {
        name: park.name
      },
      open: false,
      queuetimes: false,
      ridecount: true
    }
    if (park.web) {
      newDbParkData.website=park.web;
    }
    console.log(newDbParkData);

    var newDbParkDoc = db.collection("parks").doc()
    await newDbParkDoc.set(newDbParkData)
    console.log(`${park.name} created with doc ID: ${newDbParkDoc.id}`);
    allDbParks[newDbParkDoc.id]=park;
    counter++;
    processParks(counter);
  } else {
    var dbParkDoc = dbParkQuery.docs[0]
    console.log(`${park.name} exists with doc ID: ${dbParkDoc.id}`);
    allDbParks[dbParkDoc.id]=park;
    counter++;
    processParks(counter);
  };
};

async function processRides(counter) {
  parkId=Object.keys(allDbParks)[counter];

  if (!parkId) {
    console.log("Processed all parks/rides");
    processRide(0);
    return;
  };
  park = allDbParks[parkId];
  rides = park['attractionCollection']['attractions']

  rides.forEach(function(ride) {
    allRides.push({
      parkDocID: parkId,
      ride: ride
    })
  });

  counter++;
  processRides(counter)
};

async function processRide(counter) {
  parkRide=allRides[counter];
  if (!parkRide) {
    console.log("Processed all rides");
    process.exit();
    return;
  };
  var ride = parkRide.ride;

  console.log(parkRide);
  var dbRideQuery = await db.collection("parks").doc(parkRide.parkDocID).collection("rides").where("coasterCloudID","==",ride.id).limit(1).get();
  if (dbRideQuery.empty) {
    console.log(`${ride.name} does not exist, creating`);
    var newDbRideDoc = db.collection("parks").doc(parkRide.parkDocID).collection("rides").doc()
    var newDbRideDocData = {
      name: {
        name: ride.name
      },
      coasterCloudID: ride.id,
      queuetimes: false,
      active: false
    }
    await newDbRideDoc.set(newDbRideDocData);
    console.log("Created");
    counter++;
    processRide(counter)
  } else {
    console.log(`ride ${ride.name} exists`);
    counter++;
    processRide(counter)
  };
};

getData(1)
