const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendNotification = functions.https.onRequest(async (req, res) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }
    
    try {
        const { targetType, title, message, type, target, topic, senderId } = req.body;
        
        let messagePayload = {
            notification: {
                title: title,
                body: message
            },
            data: {
                type: type,
                senderId: senderId,
                timestamp: new Date().toISOString()
            }
        };
        
        if (targetType === 'specific' && target) {
            messagePayload.token = target;
        } else if (targetType === 'topic' && topic) {
            messagePayload.topic = topic;
        } else if (targetType === 'broadcast') {
            messagePayload.topic = 'all_devices';
        }
        
        const response = await admin.messaging().send(messagePayload);
        
        res.status(200).json({
            success: true,
            message_id: response
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
