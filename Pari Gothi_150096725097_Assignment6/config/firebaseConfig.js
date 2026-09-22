const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = require("../serviceAccountKey.json");


// Initialize Firebase Admin SDK
initializeApp({
  credential: cert(serviceAccount)
});


// Initialize Firestore
const db = getFirestore();


module.exports = {
  db
};