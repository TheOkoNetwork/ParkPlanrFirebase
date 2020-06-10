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
          parkCollection(page:${page},itemsPerPage:10) {
            parks {
              id,
              name,
              synonyms,
              shortDescription,
              slug,
              types {key,label},
              tags {key,label},
              web,
              address {street,houseNumber,city,postalCode,province,country {key}},
              latitude,
              longitude,
              attributes {key,label},
              types {key},
              images { id, small, middle, large, attribution {contributor,name,year,url,text,html}, license {label,url}},
              state { key, label(locale: "en") },
              address { country { key, label(locale: "en") }},
              history {id,key,date {format,value},value,label},
              attractionCollection {
                attractions {
                  id,
                  name,
                  shortDescription,
                  slug,
                  types {id,label},
                  tags {key,label},
                  state {key,label},
                  thrill {key,label},
                  zone {id,name},
                  manufacturers {id,label},
                  stations {id,label},
                  onride,
                  latitude,
                  longitude,
                  history {id,key,date {format,value},value,label},
                  category { key, label(locale: "en") }
                  safetyRegulation {solo {minHeight,maxHeight,minAge,maxAge,label},accompanied {minHeight,minAge,label},prohibit {minHeight,maxHeight,minAge,maxAge,label}},
                  elements {key,quantity,label}
                  images {id,small,middle,large,attribution {contributor,name,year,url,text}},
                  attributes {key,label,type,value,text, unit {key}},
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

  var dbParkQuery = await db.collection("coasterCloudparks").where("coasterCloudID","==",park.id).limit(1).get();
  if (dbParkQuery.empty) {
    console.log(`${park.name} does not exist, creating`);
    parkNoAttraction = park
    delete(parkNoAttraction.attractionCollection)
    var newDbParkData={
      coasterCloudData: parkNoAttraction
    }

    var newDbParkDoc = db.collection("coasterCloudparks").doc()
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
  if (park['attractionCollection']) {
    rides = park['attractionCollection']['attractions']
  } else {
    rides = []
  };
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

  var dbRideQuery = await db.collection("coasterCloudparks").doc(parkRide.parkDocID).collection("rides").where("coasterCloudID","==",ride.id).limit(1).get();
  if (dbRideQuery.empty) {
    console.log(`${ride.name} does not exist, creating`);
    var newDbRideDoc = db.collection("coasterCloudparks").doc(parkRide.parkDocID).collection("rides").doc()
    var newDbRideDocData = {
      name: ride
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
