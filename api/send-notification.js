// api/send-notification.js
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
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
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { to, notification, data } = req.body;
    
    if (!to) {
      return res.status(400).json({ error: 'Missing recipient token' });
    }
    
    const message = {
      token: to,
      notification: notification || {
        title: 'Duty Manager',
        body: 'New notification'
      },
      data: data || {},
      webpush: {
        fcmOptions: {
          link: process.env.APP_URL || 'https://your-app.vercel.app'
        }
      }
    };
    
    const response = await admin.messaging().send(message);
    
    console.log('Notification sent successfully:', response);
    
    return res.status(200).json({
      success: true,
      messageId: response
    });
    
  } catch (error) {
    console.error('Error sending notification:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
