const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.notifyOnSave = functions.firestore
  .document("users/{docId}")
  .onCreate(async () => {
    const tokensSnap = await admin.firestore().collection("tokens").get();
    const tokens = tokensSnap.docs.map(d => d.id);

    if (tokens.length === 0) return;

    const payload = {
      notification: {
        title: "Saved successfully ✅",
        body: "You have saved a message"
      }
    };

    await admin.messaging().sendToDevice(tokens, payload);
  });
