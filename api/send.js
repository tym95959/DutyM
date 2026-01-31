const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
    });
}

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Check authorization
    const authHeader = req.headers.authorization;
    const apiKey = authHeader?.replace('Bearer ', '');
    
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const { notification, webpush, token, tokens, topic } = req.body;
        
        let message = {
            notification: notification,
            webpush: webpush || {
                notification: {
                    ...notification,
                    requireInteraction: true,
                    icon: notification.icon || 'https://cdn-icons-png.flaticon.com/512/733/733585.png',
                    badge: 'https://cdn-icons-png.flaticon.com/512/733/733585.png',
                    actions: [
                        {
                            action: 'open',
                            title: 'Open'
                        }
                    ]
                }
            }
        };
        
        let response;
        
        if (topic) {
            // Send to topic
            message.topic = topic;
            response = await admin.messaging().send(message);
        } else if (token) {
            // Send to single device
            message.token = token;
            response = await admin.messaging().send(message);
        } else if (tokens && tokens.length > 0) {
            // Send to multiple devices (max 500 per batch)
            const batches = [];
            for (let i = 0; i < tokens.length; i += 500) {
                batches.push(tokens.slice(i, i + 500));
            }
            
            const results = await Promise.all(
                batches.map(batch => 
                    admin.messaging().sendEachForMulticast({
                        ...message,
                        tokens: batch
                    })
                )
            );
            
            response = {
                successCount: results.reduce((sum, r) => sum + r.successCount, 0),
                failureCount: results.reduce((sum, r) => sum + r.failureCount, 0),
                responses: results.flatMap(r => r.responses)
            };
        } else {
            return res.status(400).json({ error: 'No recipients specified' });
        }
        
        return res.status(200).json({
            success: true,
            messageId: response.messageId || response.responses?.[0]?.messageId,
            successCount: response.successCount || 1,
            failureCount: response.failureCount || 0
        });
        
    } catch (error) {
        console.error('Error sending notification:', error);
        return res.status(500).json({ 
            error: 'Failed to send notification',
            details: error.message 
        });
    }
};
