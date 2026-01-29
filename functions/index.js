const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendPushOnMessage = functions.firestore
  .document("messages/{id}")
  .onCreate(async (snap) => {
    const message = snap.data().text;

    const tokenSnap = await admin.firestore()
      .collection("tokens")
      .get();

    if (tokenSnap.empty) return null;

    const tokens = tokenSnap.docs.map(d => d.data().token);

    const payload = {
      notification: {
        title: "DC Alert",
        body: message
      }
    };

    await admin.messaging().sendToDevice(tokens, payload);
    return null;
  });
