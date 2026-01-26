
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
const messaging = firebase.messaging();

// Request notification permission
function requestNotificationPermission() {
  console.log('Requesting notification permission...');
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
  messaging.getToken({vapidKey: 'YOUR_VAPID_KEY'}).then((currentToken) => {
    if (currentToken) {
      console.log('FCM Token:', currentToken);
      // Send token to your server to save for this user
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
  if (currentUser) {
    db.collection('fcmTokens').doc(currentUser.username).set({
      token: token,
      username: currentUser.username,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
}

// Listen for token refresh
messaging.onTokenRefresh(() => {
  getFCMToken();
});

// Handle foreground messages
messaging.onMessage((payload) => {
  console.log('Foreground message received: ', payload);
  showNotificationInApp(payload);
});

// Initialize notifications after login
function initNotifications() {
  requestNotificationPermission();
}
