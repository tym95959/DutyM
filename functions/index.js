const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.sendAnnouncementNotification = functions.firestore
    .document('announcements/{announcementId}')
    .onCreate(async (snapshot, context) => {
        const announcement = snapshot.data();
        
        // Only send notification for high priority announcements
        if (!announcement.priority) return null;

        const message = {
            notification: {
                title: announcement.title,
                body: announcement.message.substring(0, 100) + '...'
            },
            data: {
                type: 'announcement',
                announcementId: context.params.announcementId,
                click_action: 'FLUTTER_NOTIFICATION_CLICK'
            },
            topic: 'announcements' // Or send to specific tokens
        };

        try {
            const response = await admin.messaging().send(message);
            console.log('Successfully sent message:', response);
            return response;
        } catch (error) {
            console.error('Error sending message:', error);
            return null;
        }
    });
