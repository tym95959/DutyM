// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAf_sjwVHG65vKhezpS_L7KC2j0WHIDaWc",
  authDomain: "leelidc-1f753.firebaseapp.com",
  projectId: "leelidc-1f753",
  storageBucket: "leelidc-1f753.firebasestorage.app",
  messagingSenderId: "43622932335",
  appId: "1:43622932335:web:a7529bce1f19714687129a",
  measurementId: "G-3KD6ZYS599",
  vapidKey: "BCMEhQHZvwuii0Pul11PRfM68N_C4iox9c6jUwWoj21lvKZ2hhAfRe-5KwG_A1xMsQ04aelb8XM7x-mXNYzak1o"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Initialize Analytics
let analytics = null;
try {
  analytics = firebase.analytics();
} catch (error) {
  console.log('Analytics initialization failed:', error);
}

// Initialize Messaging
let messaging = null;
try {
  if (firebase.messaging.isSupported()) {
    messaging = firebase.messaging();
  }
} catch (error) {
  console.log('Messaging initialization failed:', error);
}

// Request notification permission
function requestNotificationPermission() {
  console.log('Requesting notification permission...');
  
  if (!messaging) {
    console.log('Firebase Messaging not supported');
    return;
  }
  
  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      getFCMToken();
    } else {
      console.log('Unable to get permission to notify.');
    }
  });
}

// Get FCM token
function getFCMToken() {
  if (!messaging) {
    console.log('Firebase Messaging not available');
    return;
  }
  
  messaging.getToken({vapidKey: firebaseConfig.vapidKey}).then((currentToken) => {
    if (currentToken) {
      console.log('FCM Token:', currentToken);
      // Send token to Firestore
      saveTokenToDatabase(currentToken);
    } else {
      console.log('No registration token available.');
    }
  }).catch((err) => {
    console.log('An error occurred while retrieving token. ', err);
  });
}

// Save token to Firestore
function saveTokenToDatabase(token) {
  const currentUser = JSON.parse(localStorage.getItem('dutySystemSession'));
  if (currentUser && db) {
    db.collection('fcmTokens').doc(currentUser.username).set({
      token: token,
      username: currentUser.username,
      name: currentUser.name,
      rcNo: currentUser.rcNo,
      level: currentUser.level,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      lastActive: new Date().toISOString(),
      userAgent: navigator.userAgent,
      platform: navigator.platform
    }, { merge: true })
    .then(() => {
      console.log('Token saved to Firestore');
    })
    .catch((error) => {
      console.error('Error saving token:', error);
    });
  }
}

// Send push notification to specific user
async function sendPushNotificationToUser(username, title, body, data = {}) {
  try {
    // Get user's token from Firestore
    const tokenDoc = await db.collection('fcmTokens').doc(username).get();
    
    if (!tokenDoc.exists) {
      console.log('User has no FCM token');
      return false;
    }
    
    const userToken = tokenDoc.data().token;
    
    // For production, you would use a backend server to send notifications
    // This is just for demonstration
    console.log('Would send notification to:', username);
    console.log('Title:', title);
    console.log('Body:', body);
    console.log('Data:', data);
    
    // Here you would typically call your backend server
    // Example:
    // return fetch('/api/send-notification', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     to: userToken,
    //     notification: { title, body },
    //     data
    //   })
    // });
    
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

// Send announcement to all users
async function sendAnnouncementToAllUsers(title, content, priority = 'medium', createdBy) {
  try {
    // Get all active tokens
    const tokensSnapshot = await db.collection('fcmTokens').get();
    const tokens = [];
    
    tokensSnapshot.forEach(doc => {
      tokens.push(doc.data().token);
    });
    
    console.log('Would send announcement to', tokens.length, 'users');
    
    // In production, you would batch send notifications
    // For demo, we'll just log
    tokens.forEach(token => {
      console.log('Notification for token:', token.substring(0, 20) + '...');
    });
    
    return tokens.length;
  } catch (error) {
    console.error('Error sending announcement:', error);
    return 0;
  }
}

// Track user activity
function trackUserActivity(action, details = {}) {
  if (!analytics) return;
  
  const currentUser = JSON.parse(localStorage.getItem('dutySystemSession'));
  if (currentUser) {
    analytics.setUserId(currentUser.username);
    analytics.setUserProperties({
      rcNo: currentUser.rcNo,
      level: currentUser.level
    });
  }
  
  analytics.logEvent(action, details);
}

// Initialize notifications after login
function initNotifications() {
  requestNotificationPermission();
}

// Update user last active time
function updateUserLastActive() {
  const currentUser = JSON.parse(localStorage.getItem('dutySystemSession'));
  if (currentUser && db) {
    db.collection('fcmTokens').doc(currentUser.username).update({
      lastActive: new Date().toISOString()
    });
  }
}

// Update last active every minute when user is logged in
setInterval(() => {
  if (localStorage.getItem('dutySystemSession')) {
    updateUserLastActive();
  }
}, 60000);

// Export Firebase instances
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    app,
    db,
    messaging,
    analytics,
    requestNotificationPermission,
    getFCMToken,
    sendPushNotificationToUser,
    sendAnnouncementToAllUsers,
    trackUserActivity,
    initNotifications
  };
}
