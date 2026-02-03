const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Function to save FCM token
exports.saveToken = functions.https.onCall((data, context) => {
  // For testing, allow without authentication
  const token = data.token;
  console.log('Token received:', token);
  
  return {
    success: true,
    message: 'Token saved for testing'
  };
});

// Function to send test notification
exports.sendTestNotification = functions.https.onCall((data, context) => {
  const { token, title, body } = data;
  
  const message = {
    token: token,
    notification: {
      title: title || 'Test Notification',
      body: body || 'This is a test notification from Firebase!'
    },
    webpush: {
      notification: {
        icon: 'https://leelidc-1f753.firebaseapp.com/icon-192x192.png',
        badge: 'https://leelidc-1f753.firebaseapp.com/badge-72x72.png',
        actions: [
          {
            action: 'open',
            title: 'Open App'
          }
        ]
      }
    }
  };
  
  return admin.messaging().send(message)
    .then((response) => {
      console.log('Successfully sent message:', response);
      return { success: true, messageId: response };
    })
    .catch((error) => {
      console.error('Error sending message:', error);
      throw new functions.https.HttpsError('internal', error.message);
    });
});
