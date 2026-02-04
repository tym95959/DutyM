// api/saveToken.js
import admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf-8'),
  };
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "No token provided" });

    await admin.firestore().collection("tokens").doc(token).set({
      createdAt: new Date(),
    });

    res.status(200).json({ message: "Token saved ✅" });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}
