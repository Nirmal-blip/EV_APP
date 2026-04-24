const admin = require("firebase-admin");

// Render environment variable se JSON load karo
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);

// Firebase initialize karo
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Firestore database reference
const db = admin.firestore();

module.exports = db;