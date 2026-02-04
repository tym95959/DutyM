// api/sendPush.js
import admin from "firebase-admin";

// Initialize Firebase Admin once
if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: Buffer.from(
      process.env.FIREBASE_PRIVATE_KEY_BASE64,
      "base64"
    ).toString("utf-8"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { title, body } = req.body;

    // Fetch all device tokens from Firestore
    const tokensSnapshot = await admin.firestore().collection("tokens").get();
    const tokens = tokensSnapshot.docs.map((doc) => doc.id);

    if (tokens.length === 0) {
      return res.status(200).json({ message: "No registered devices." });
    }

    const message = {
      notification: { title, body },
      tokens,
    };

    const response = await admin.messaging().sendMulticast(message);

    res.status(200).json({
      message: "Notification sent!",
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}
