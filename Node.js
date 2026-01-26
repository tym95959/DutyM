// server/send-notification.js
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'YOUR_PROJECT_ID'
});

async function sendNotificationToUser(username, title, body, data = {}) {
  try {
    // Get user's FCM token from Firestore
    const tokenDoc = await admin.firestore()
      .collection('fcmTokens')
      .doc(username)
      .get();
    
    if (!tokenDoc.exists) {
      console.log('No token found for user:', username);
      return;
    }
    
    const token = tokenDoc.data().token;
    
    const message = {
      notification: {
        title: title,
        body: body
      },
      data: data,
      token: token
    };
    
    const response = await admin.messaging().send(message);
    console.log('Notification sent:', response);
    return response;
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Example: Send announcement notification
async function sendAnnouncementNotification(announcement) {
  // Get all users
  const usersSnapshot = await admin.firestore()
    .collection('users')
    .get();
  
  const promises = usersSnapshot.docs.map(doc => 
    sendNotificationToUser(doc.id, 
      `New Announcement: ${announcement.title}`,
      announcement.content.substring(0, 100) + '...',
      { 
        type: 'announcement', 
        announcementId: announcement.id,
        action: 'viewAnnouncement'
      }
    )
  );
  
  await Promise.all(promises);
}
