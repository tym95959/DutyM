import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getMessaging, getToken, onMessage, isSupported } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAf_sjwVHG65vKhezpS_L7KC2j0WHIDaWc",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "leelidc-1f753.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "leelidc-1f753",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "leelidc-1f753.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "43622932335",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:43622932335:web:a7529bce1f19714687129a",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let messaging = null;

// DOM Elements
const swStatus = document.getElementById('swStatus');
const permissionStatus = document.getElementById('permissionStatus');
const tokenStatus = document.getElementById('tokenStatus');
const requestPermissionBtn = document.getElementById('requestPermissionBtn');
const copyTokenBtn = document.getElementById('copyTokenBtn');
const notificationElement = document.getElementById('notification');
const notificationTitle = document.getElementById('notificationTitle');
const notificationBody = document.getElementById('notificationBody');

// Check and update service worker status
async function checkServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                swStatus.textContent = 'Active';
                swStatus.className = 'status-value active';
                return true;
            } else {
                swStatus.textContent = 'Not Registered';
                swStatus.className = 'status-value inactive';
                return false;
            }
        } catch (error) {
            console.error('Service Worker check failed:', error);
            swStatus.textContent = 'Error';
            swStatus.className = 'status-value inactive';
            return false;
        }
    } else {
        swStatus.textContent = 'Not Supported';
        swStatus.className = 'status-value inactive';
        return false;
    }
}

// Check notification permission
function checkNotificationPermission() {
    const permission = Notification.permission;
    permissionStatus.textContent = permission.charAt(0).toUpperCase() + permission.slice(1);
    permissionStatus.className = `status-value ${permission === 'granted' ? 'active' : 'inactive'}`;
    
    if (permission === 'granted') {
        requestPermissionBtn.textContent = 'Permission Granted ✓';
        requestPermissionBtn.disabled = true;
    } else {
        requestPermissionBtn.textContent = 'Enable Push Notifications';
        requestPermissionBtn.disabled = false;
    }
    
    return permission === 'granted';
}

// Register service worker
async function registerServiceWorker() {
    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
        });
        console.log('Service Worker registered:', registration);
        swStatus.textContent = 'Active';
        swStatus.className = 'status-value active';
        return registration;
    } catch (error) {
        console.error('Service Worker registration failed:', error);
        swStatus.textContent = 'Registration Failed';
        swStatus.className = 'status-value inactive';
        throw error;
    }
}

// Initialize Firebase Messaging
async function initFirebaseMessaging() {
    const isFcmSupported = await isSupported();
    if (!isFcmSupported) {
        console.error('FCM is not supported in this browser');
        tokenStatus.textContent = 'Not Supported';
        tokenStatus.className = 'status-value inactive';
        return null;
    }
    
    messaging = getMessaging(app);
    return messaging;
}

// Request notification permission and get FCM token
async function requestNotificationPermission() {
    try {
        const permission = await Notification.requestPermission();
        checkNotificationPermission();
        
        if (permission === 'granted') {
            const messaging = await initFirebaseMessaging();
            if (!messaging) return;
            
            // Get VAPID key from environment or use your public key
            const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || "BGpd...";
            
            // Get FCM token
            const token = await getToken(messaging, { vapidKey });
            
            if (token) {
                tokenStatus.textContent = 'Registered ✓';
                tokenStatus.className = 'status-value active';
                
                // Store token in localStorage
                localStorage.setItem('fcm_token', token);
                console.log('FCM Token:', token);
                
                // Send token to your server (optional)
                await sendTokenToServer(token);
                
                return token;
            } else {
                tokenStatus.textContent = 'No Token';
                tokenStatus.className = 'status-value inactive';
                return null;
            }
        }
    } catch (error) {
        console.error('Error getting permission or token:', error);
        tokenStatus.textContent = 'Error';
        tokenStatus.className = 'status-value inactive';
        return null;
    }
}

// Send token to server (optional)
async function sendTokenToServer(token) {
    try {
        const response = await fetch('/api/save-token', {
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

// Handle incoming messages when app is in foreground
function setupForegroundMessages(messaging) {
    onMessage(messaging, (payload) => {
        console.log('Message received in foreground:', payload);
        
        // Show notification
        showLocalNotification(payload);
        
        // Update UI
        if (payload.notification) {
            notificationTitle.textContent = payload.notification.title;
            notificationBody.textContent = payload.notification.body;
            notificationElement.classList.add('show');
            
            // Auto hide after 5 seconds
            setTimeout(() => {
                notificationElement.classList.remove('show');
            }, 5000);
        }
    });
}

// Show local notification (for foreground)
function showLocalNotification(payload) {
    if (Notification.permission === 'granted') {
        const options = {
            body: payload.notification?.body || 'New message',
            icon: '/icon-192.png',
            badge: '/badge-72.png',
            tag: 'push-notification',
            requireInteraction: true,
            actions: [
                {
                    action: 'open',
                    title: 'Open App'
                },
                {
                    action: 'close',
                    title: 'Close'
                }
            ]
        };
        
        const notification = new Notification(
            payload.notification?.title || 'New Notification',
            options
        );
        
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
}

// Copy token to clipboard
copyTokenBtn.addEventListener('click', async () => {
    const token = localStorage.getItem('fcm_token');
    if (token) {
        try {
            await navigator.clipboard.writeText(token);
            alert('Token copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    } else {
        alert('No token available. Please enable notifications first.');
    }
});

// Request permission button click
requestPermissionBtn.addEventListener('click', async () => {
    if (!('serviceWorker' in navigator)) {
        alert('Service workers are not supported in your browser.');
        return;
    }
    
    if (!('Notification' in window)) {
        alert('Notifications are not supported in your browser.');
        return;
    }
    
    // Register service worker
    await registerServiceWorker();
    
    // Request permission and get token
    await requestNotificationPermission();
});

// Initialize app
async function initApp() {
    // Check initial status
    await checkServiceWorker();
    checkNotificationPermission();
    
    // If already have permission, initialize messaging
    if (Notification.permission === 'granted') {
        const messaging = await initFirebaseMessaging();
        if (messaging) {
            setupForegroundMessages(messaging);
            
            // Try to get existing token
            const token = localStorage.getItem('fcm_token');
            if (token) {
                tokenStatus.textContent = 'Registered ✓';
                tokenStatus.className = 'status-value active';
            }
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Page became visible, you might want to sync notifications
        console.log('App is now visible');
    }
});
