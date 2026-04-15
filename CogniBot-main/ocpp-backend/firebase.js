const admin = require("firebase-admin");

// service account file load karo
const serviceAccount = require("./serviceAccountKey.json");

// Firebase initialize karo
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Firestore database reference
const db = admin.firestore();

module.exports = db;