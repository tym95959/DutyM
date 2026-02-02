import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // In production, get tokens from your database
    const { title, body, icon } = req.body;
    
    // For demo, you'll need to store tokens in a database
    // Here's a placeholder for the actual implementation
    
    const message = {
      notification: {
        title: title || 'New Message',
        body: body || 'You have a new notification',
      },
      webpush: {
        notification: {
          icon: icon || '/icon-192.png',
          badge: '/icon-192.png',
        },
      },
      // Add tokens from your database here
      // token: 'YOUR_DEVICE_TOKEN'
    };

    // Send notification
    // const response = await admin.messaging().send(message);
    
    res.status(200).json({ 
      message: 'Notification sent (demo mode)',
      // response: response 
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: error.message });
  }
}
