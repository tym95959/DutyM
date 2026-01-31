const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
    });
}

const db = admin.firestore();

module.exports = async (req, res) => {
    // Set CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }
        
        // Store token in Firestore
        await db.collection('fcm_tokens').doc(token).set({
            token: token,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            userAgent: req.headers['user-agent'],
            lastSeen: admin.firestore.FieldValue.serverTimestamp()
        });
        
        return res.status(200).json({ success: true });
        
    } catch (error) {
        console.error('Error saving token:', error);
        return res.status(500).json({ error: 'Failed to save token' });
    }
};
