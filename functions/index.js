const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// 1. Save FCM Token to Firestore
exports.saveFCMToken = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const uid = context.auth.uid;
  const { fcmToken } = data;

  try {
    await admin.firestore()
      .collection('users')
      .doc(uid)
      .set({
        fcmToken: fcmToken,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

    return { success: true, message: 'Token saved successfully' };
  } catch (error) {
    console.error('Error saving token:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to save token'
    );
  }
});

// 2. Send Push Notification to User
exports.sendPushNotification = functions.https.onCall(async (data, context) => {
  const { userId, title, body, data: extraData } = data;

  try {
    // Get user's FCM token
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'User not found'
      );
    }

    const userData = userDoc.data();
    const token = userData.fcmToken;

    if (!token) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'User does not have an FCM token'
      );
    }

    // Notification payload
    const message = {
      token: token,
      notification: {
        title: title || 'Notification',
        body: body || 'You have a new notification'
      },
      data: {
        ...extraData,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        sound: 'default'
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    // Send notification
    const response = await admin.messaging().send(message);
    
    // Log the notification
    await admin.firestore()
      .collection('notifications')
      .add({
        userId: userId,
        title: message.notification.title,
        body: message.notification.body,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        messageId: response
      });

    return { 
      success: true, 
      messageId: response,
      message: 'Notification sent successfully'
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to send notification'
    );
  }
});

// 3. Trigger Notification on Database Event (Optional)
exports.sendNotificationOnNewMessage = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    const message = snapshot.data();
    const { senderId, receiverId, content } = message;

    // Get receiver's token
    const receiverDoc = await admin.firestore()
      .collection('users')
      .doc(receiverId)
      .get();

    if (!receiverDoc.exists) return null;

    const receiverData = receiverDoc.data();
    const token = receiverData.fcmToken;

    if (!token) return null;

    const notification = {
      token: token,
      notification: {
        title: 'New Message',
        body: content || 'You have a new message'
      },
      data: {
        type: 'NEW_MESSAGE',
        chatId: context.params.chatId,
        senderId: senderId,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      }
    };

    return admin.messaging().send(notification);
  });
