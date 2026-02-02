// Firebase configuration - REPLACE WITH YOUR ACTUAL CONFIG
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Vercel server URL - REPLACE WITH YOUR VERCEL URL
const SERVER_URL = 'https://your-vercel-app.vercel.app';

// DOM elements
const enableButton = document.getElementById('enableButton');
const testButton = document.getElementById('testButton');
const statusDiv = document.getElementById('status');
const notificationDiv = document.getElementById('notification');
const notificationText = document.getElementById('notificationText');

// Request permission for notifications
async function requestPermission() {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      statusDiv.textContent = 'Notification permission granted!';
      enableButton.disabled = true;
      enableButton.textContent = '✓ Notifications Enabled';
      testButton.disabled = false;
      await getToken();
    } else {
      statusDiv.textContent = 'Notification permission denied.';
    }
  } catch (error) {
    console.error('Error requesting permission:', error);
    statusDiv.textContent = 'Error requesting permission.';
  }
}

// Get FCM token
async function getToken() {
  try {
    const currentToken = await messaging.getToken({
      vapidKey: "YOUR_VAPID_KEY" // Get this from Firebase Console > Cloud Messaging
    });
    
    if (currentToken) {
      console.log('FCM Token:', currentToken);
      statusDiv.textContent = 'Token received! Ready for notifications.';
      
      // Send token to your server (Vercel function)
      await sendTokenToServer(currentToken);
    } else {
      statusDiv.textContent = 'No registration token available.';
    }
  } catch (error) {
    console.error('Error getting token:', error);
    statusDiv.textContent = 'Error getting token.';
  }
}

// Send token to Vercel server
async function sendTokenToServer(token) {
  try {
    const response = await fetch(`${SERVER_URL}/api/save-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token })
    });
    
    if (response.ok) {
      console.log('Token saved to server');
    }
  } catch (error) {
    console.error('Error sending token to server:', error);
  }
}

// Send test notification
async function sendTestNotification() {
  try {
    const response = await fetch(`${SERVER_URL}/api/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Notification',
        body: 'This is a test notification!',
        icon: '/icon-192.png'
      })
    });
    
    if (response.ok) {
      notificationText.textContent = 'Test notification sent! Check your notifications.';
      notificationDiv.style.display = 'block';
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    notificationText.textContent = 'Error sending notification.';
    notificationDiv.style.display = 'block';
  }
}

// Handle incoming messages when app is in foreground
messaging.onMessage((payload) => {
  console.log('Foreground message:', payload);
  
  notificationText.textContent = payload.notification?.body || 'New notification received!';
  notificationDiv.style.display = 'block';
  
  // Show local notification
  if (Notification.permission === 'granted') {
    new Notification(payload.notification?.title || 'New Message', {
      body: payload.notification?.body,
      icon: payload.notification?.icon || '/icon-192.png'
    });
  }
});

// Check notification permission on load
document.addEventListener('DOMContentLoaded', () => {
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      statusDiv.textContent = 'Notifications already enabled!';
      enableButton.disabled = true;
      enableButton.textContent = '✓ Notifications Enabled';
      testButton.disabled = false;
      getToken();
    } else if (Notification.permission === 'denied') {
      statusDiv.textContent = 'Notifications blocked. Please enable in browser settings.';
      enableButton.disabled = true;
    }
  } else {
    statusDiv.textContent = 'This browser does not support notifications.';
    enableButton.disabled = true;
  }
  
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('Service Worker registered'))
      .catch(error => console.error('Service Worker registration failed:', error));
  }
});

// Event listeners
enableButton.addEventListener('click', requestPermission);
testButton.addEventListener('click', sendTestNotification);
