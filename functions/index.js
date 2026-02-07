// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Subscribe user to topic
exports.subscribeToTopic = functions.https.onRequest(async (req, res) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    
    try {
        const { token, topic } = req.body;
        
        if (!token || !topic) {
            return res.status(400).json({ 
                error: 'Token and topic are required' 
            });
        }
        
        // Subscribe the token to topic
        await admin.messaging().subscribeToTopic(token, topic);
        
        res.json({ 
            success: true,
            message: `Subscribed to ${topic} topic`
        });
    } catch (error) {
        console.error('Error subscribing to topic:', error);
        res.status(500).json({ 
            error: error.message 
        });
    }
});

// Send notification to all users (admin function)
exports.sendToAllUsers = functions.https.onCall(async (data, context) => {
    // Only allow authenticated users (optional)
    // if (!context.auth) {
    //     throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    // }
    
    const { title, body, url, icon } = data;
    
    if (!title || !body) {
        throw new functions.https.HttpsError('invalid-argument', 'Title and body are required');
    }
    
    const message = {
        notification: {
            title: title,
            body: body,
            icon: icon || 'https://YOUR-APP-URL/icon.png'
        },
        data: {
            url: url || '',
            click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        topic: 'all_users'
    };
    
    try {
        const response = await admin.messaging().send(message);
        return { 
            success: true, 
            messageId: response,
            count: 'Sent to all subscribed users'
        };
    } catch (error) {
        console.error('Error sending message:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
