const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendAnnouncementPush = functions.firestore
  .document('announcements/{docId}')
  .onCreate(async (snap, context) => {
    const newData = snap.data();
    const text = newData.text;

    // Get all FCM tokens
    const tokensSnap = await admin.firestore().collection('tokens').get();
    const tokens = tokensSnap.docs.map(doc => doc.data().token);

    if (tokens.length === 0) return null;

    const payload = {
      notification: {
        title: "New Announcement",
        body: text,
        click_action: "/index.html"
      }
    };

    return admin.messaging().sendToDevice(tokens, payload);
  });
