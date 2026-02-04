import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { token } = req.body;
    await admin.firestore().collection("tokens").doc(token).set({ createdAt: new Date() });

    res.status(200).json({ message: "Token saved ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
