const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendUserNotification = functions.firestore
  .document("users/{docId}")
  .onCreate(async (snap, context)=>{
    const newUser = snap.data();
    const tokensSnapshot = await admin.firestore().collection("tokens").get();
    const tokens = tokensSnapshot.docs.map(doc=>doc.data().token);
    if(tokens.length===0) return;

    const message = {
      notification: {
        title: "New User Added",
        body: `Name: ${newUser.name}, Age: ${newUser.age}`
      },
      tokens: tokens
    };

    await admin.messaging().sendMulticast(message);
    console.log("Notifications sent:", tokens);
  });
