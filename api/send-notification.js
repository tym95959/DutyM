// api/send-notification.js
const admin = require('firebase-admin');

// Initialize Firebase Admin (one time)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
    });
}

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { token, title, body, url, data } = req.body;
        
        if (!token || !title || !body) {
            return res.status(400).json({ 
                error: 'Missing required fields: token, title, body' 
            });
        }
        
        // Prepare notification payload
        const payload = {
            notification: {
                title: title,
                body: body,
                icon: '/icon.png',
                badge: '/badge.png'
            },
            data: {
                url: url || '',
                ...data
            },
            token: token
        };
        
        // Send notification
        const response = await admin.messaging().send(payload);
        
        console.log('Notification sent successfully:', response);
        
        return res.status(200).json({ 
            success: true, 
            messageId: response,
            message: 'Notification sent successfully'
        });
        
    } catch (error) {
        console.error('Error sending notification:', error);
        
        return res.status(500).json({ 
            error: 'Failed to send notification',
            details: error.message 
        });
    }
}
