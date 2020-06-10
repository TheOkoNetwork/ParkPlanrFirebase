const fetch = require("node-fetch");
const createHttpLink = require("apollo-link-http").createHttpLink;
const InMemoryCache = require("apollo-cache-inmemory").InMemoryCache;
const ApolloClient = require("apollo-client").ApolloClient;
const gql = require("graphql-tag");

const admin = require("firebase-admin");

const open = require("open");
const player = require("play-sound")();

var dev = true;
if (dev) {
  var serviceAccount = require("../serviceAccountKey_Dev.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://parkplanr-dev.firebaseio.com",
  });
} else {
  console.log("***** P R O D U C T I O N ******");
  var serviceAccount = require("../serviceAccountKey_Production.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://fir-parkplanr.firebaseio.com",
  });
}

const db = admin.firestore();

async function getData() {
  var parkDocs = await db
    .collection('parks')
    .where('active', '==', true)
    .where('queuetimes', '==', true)
    .orderBy('name.name', 'asc')
    .get()
  console.log(`Got ${parkDocs.docs.length} parks`);
}

getData(1);
