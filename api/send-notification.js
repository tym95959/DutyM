// api/send-notification.js
const admin = require('firebase-admin');

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  });
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { token, title = 'Test', body = 'Notification', data = {} } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'FCM token is required' });
    }
    
    const message = {
      notification: { title, body },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        timestamp: new Date().toISOString()
      },
      token: token,
      webpush: {
        headers: {
          Urgency: 'high'
        },
        notification: {
          icon: 'https://your-vercel-app.vercel.app/icon-192x192.png',
          badge: 'https://your-vercel-app.vercel.app/badge-72x72.png',
          requireInteraction: true,
          vibrate: [200, 100, 200]
        }
      }
    };
    
    const response = await admin.messaging().send(message);
    
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
};
