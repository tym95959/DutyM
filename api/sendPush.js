import fetch from "node-fetch";
import jwt from "jsonwebtoken";
import admin from "firebase-admin";

const serviceAccount = {
  project_id: process.env.FIREBASE_PROJECT_ID,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { title, body } = req.body;

  // 1️⃣ Fetch all registered tokens from Firestore
  const snapshot = await admin.firestore().collection("tokens").get();
  const tokens = snapshot.docs.map(doc => doc.data().token);

  if (!tokens.length) return res.json({ message: "No registered devices" });

  // 2️⃣ Generate OAuth token for FCM HTTP v1
  const now = Math.floor(Date.now() / 1000);
  const jwtToken = jwt.sign(
    {
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600
    },
    serviceAccount.private_key,
    { algorithm: "RS256" }
  );

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwtToken}`
  });
  const { access_token } = await tokenRes.json();

  // 3️⃣ Send push to each token
  const results = [];
  for (const token of tokens) {
    const fcmRes = await fetch(
      `https://fcm.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body }
          }
        })
      }
    );

    const json = await fcmRes.json();
    results.push(json);
  }

  res.json({ message: `Push sent to ${tokens.length} devices`, results });
}
