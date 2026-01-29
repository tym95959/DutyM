// Node.js Firebase Admin SDK
import admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

db.collection("announcements").onSnapshot(async (snapshot) => {
  snapshot.docChanges().forEach(async (change) => {
    if(change.type === "added"){
      const msg = change.doc.data().message;

      const payload = {
        notification: {
          title: "New Announcement",
          body: msg
        }
      };

      // Send to all FCM tokens stored in your DB
      const tokens = ["user_token_1", "user_token_2"]; 
      await admin.messaging().sendToDevice(tokens, payload);
    }
  });
});
