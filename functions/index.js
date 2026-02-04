const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Store user tokens (in production, use Firestore)
const userTokens = new Map();

// API endpoint to save FCM token
app.post('/save-token', async (req, res) => {
  try {
    const { token, userId } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
    
    userTokens.set(userId || 'anonymous', token);
    console.log('Token saved for user:', userId || 'anonymous');
    
    res.status(200).json({ 
      success: true, 
      message: 'Token saved successfully' 
    });
  } catch (error) {
    console.error('Error saving token:', error);
    res.status(500).json({ error: 'Failed to save token' });
  }
});

// API endpoint to send push notification
app.post('/send-notification', async (req, res) => {
  try {
    const { title, body, userId, data } = req.body;
    
    const token = userTokens.get(userId || 'anonymous');
    
    if (!token) {
      return res.status(404).json({ error: 'User token not found' });
    }
    
    const message = {
      notification: {
        title: title || 'Test Notification',
        body: body || 'This is a test notification from Firebase!'
      },
      data: data || {},
      token: token
    };
    
    const response = await admin.messaging().send(message);
    console.log('Notification sent successfully:', response);
    
    res.status(200).json({ 
      success: true, 
      messageId: response,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Send test notification to all users
app.post('/send-test-all', async (req, res) => {
  try {
    const tokens = Array.from(userTokens.values());
    
    if (tokens.length === 0) {
      return res.status(404).json({ error: 'No user tokens found' });
    }
    
    const message = {
      notification: {
        title: 'Test to All Users',
        body: 'This is a test notification sent to all subscribed users!'
      },
      tokens: tokens
    };
    
    const response = await admin.messaging().sendMulticast(message);
    console.log('Multicast sent:', response.successCount, 'successful');
    
    res.status(200).json({ 
      success: true, 
      sentCount: response.successCount,
      failedCount: response.failureCount
    });
  } catch (error) {
    console.error('Error sending multicast:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// Get list of subscribed users
app.get('/subscribed-users', (req, res) => {
  const users = Array.from(userTokens.entries()).map(([userId, token]) => ({
    userId,
    tokenPreview: token.substring(0, 20) + '...'
  }));
  
  res.status(200).json({ 
    count: users.length,
    users 
  });
});

// Export as Firebase Function
exports.pushNotification = functions.https.onRequest(app);
