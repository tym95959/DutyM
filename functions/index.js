const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendAnnouncementNotification = functions.firestore
  .document("announcements/{annId}")
  .onCreate(async (snap, context) => {
    const announcement = snap.data();

    const payload = {
      notification: {
        title: announcement.title,
        body: announcement.body,
      }
    };

    try {
      const tokensSnapshot = await admin.firestore().collection("fcmTokens").get();
      const tokens = tokensSnapshot.docs.map(doc => doc.id);

      if (tokens.length === 0) {
        console.log("No tokens found");
        return;
      }

      const response = await admin.messaging().sendMulticast({
        tokens: tokens,
        ...payload
      });

      console.log(`Success: ${response.successCount}, Failure: ${response.failureCount}`);

      // Optional: Clean invalid tokens
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) failedTokens.push(tokens[idx]);
      });
      if (failedTokens.length > 0) {
        const batch = admin.firestore().batch();
        failedTokens.forEach(token => batch.delete(admin.firestore().doc(`fcmTokens/${token}`)));
        await batch.commit();
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  });
