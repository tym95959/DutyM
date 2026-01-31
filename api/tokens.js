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
    res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Check authorization for DELETE
    if (req.method === 'DELETE') {
        const authHeader = req.headers.authorization;
        const apiKey = authHeader?.replace('Bearer ', '');
        
        if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const token = req.query.token;
        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }
        
        try {
            await db.collection('fcm_tokens').doc(token).delete();
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('Error deleting token:', error);
            return res.status(500).json({ error: 'Failed to delete token' });
        }
    }
    
    // GET method
    if (req.method === 'GET') {
        const authHeader = req.headers.authorization;
        const apiKey = authHeader?.replace('Bearer ', '');
        
        if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        try {
            const snapshot = await db.collection('fcm_tokens')
                .orderBy('lastSeen', 'desc')
                .limit(1000)
                .get();
            
            const tokens = [];
            snapshot.forEach(doc => {
                tokens.push(doc.id);
            });
            
            return res.status(200).json({ tokens });
            
        } catch (error) {
            console.error('Error fetching tokens:', error);
            return res.status(500).json({ error: 'Failed to fetch tokens' });
        }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
};
