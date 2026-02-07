// Initialize Firebase
const firebaseConfig= {
    apiKey: "AIzaSyAf_sjwVHG65vKhezpS_L7KC2j0WHIDaWc",
    authDomain: "leelidc-1f753.firebaseapp.com",
    projectId: "leelidc-1f753",
    storageBucket: "leelidc-1f753.firebasestorage.app",
    messagingSenderId: "43622932335",
    appId: "1:43622932335:web:a7529bce1f19714687129a",
    measurementId: "G-3KD6ZYS599"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('Received background message: ', payload);
    
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/firebase-logo.png' // Add your icon
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Request permission and get token
async function getToken() {
    try {
        // Request permission for notifications
        await Notification.requestPermission();
        
        // Get registration token
        const token = await messaging.getToken({
            vapidKey: 'YOUR_VAPID_KEY' // Get this from Firebase Console > Cloud Messaging
        });
        
        console.log('Device token:', token);
        return token;
    } catch (error) {
        console.error('Error getting token:', error);
        return null;
    }
}

// Handle token refresh
messaging.onTokenRefresh(async () => {
    try {
        const refreshedToken = await messaging.getToken();
        console.log('Token refreshed:', refreshedToken);
        
        // Send the new token to your server
        await fetch('save-token.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: refreshedToken })
        });
    } catch (error) {
        console.error('Unable to retrieve refreshed token ', error);
    }
});

// Handle incoming messages when app is in foreground
messaging.onMessage((payload) => {
    console.log('Message received in foreground: ', payload);
    
    // Show notification
    if (payload.notification) {
        const { title, body } = payload.notification;
        new Notification(title, { body: body });
    }
});
