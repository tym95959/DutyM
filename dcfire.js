// dcfire.js - Corrected version
console.log("dcfire.js loading...");

// Check if Firebase is already initialized
if (typeof firebase === 'undefined') {
    console.error("Firebase SDK not loaded. Make sure firebase scripts are loaded before this file.");
} else {
    console.log("Firebase SDK is available");
}

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAf_sjwVHG65vKhezpS_L7KC2j0WHIDaWc",
    authDomain: "leelidc-1f753.firebaseapp.com",
    projectId: "leelidc-1f753",
    storageBucket: "leelidc-1f753.firebasestorage.app",
    messagingSenderId: "43622932335",
    appId: "1:43622932335:web:a7529bce1f19714687129a",
    measurementId: "G-3KD6ZYS599"
};

console.log("Initializing Firebase...");

// Initialize Firebase (only if not already initialized)
let app, db, messaging, analytics;

try {
    if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
        console.log("✅ Firebase initialized successfully");
    } else {
        app = firebase.app();
        console.log("✅ Using existing Firebase app");
    }
    
    // Initialize Firestore
    db = firebase.firestore();
    console.log("✅ Firestore initialized");
    
    // Initialize Analytics if available
    try {
        analytics = firebase.analytics();
        console.log("✅ Analytics initialized");
    } catch (analyticsError) {
        console.warn("Analytics not available:", analyticsError);
        analytics = null;
    }
    
    // Initialize Messaging if available
    try {
        if (firebase.messaging && firebase.messaging.isSupported()) {
            messaging = firebase.messaging();
            console.log("✅ Messaging initialized");
        } else {
            console.warn("Messaging not supported");
            messaging = null;
        }
    } catch (messagingError) {
        console.warn("Messaging initialization failed:", messagingError);
        messaging = null;
    }
    
    // Test Firestore connection
    testFirestoreConnection();
    
} catch (error) {
    console.error("❌ Firebase initialization error:", error);
    alert("Firebase initialization failed. Please check console for details.");
}

// Test Firestore Connection
async function testFirestoreConnection() {
    if (!db) {
        console.error("❌ db is not initialized");
        return;
    }
    
    try {
        console.log("Testing Firestore connection...");
        
        // Create test collection if it doesn't exist
        await db.collection("testConnection").doc("test").set({
            timestamp: new Date().toISOString(),
            message: "Firestore connection successful"
        }, { merge: true });
        
        console.log("✅ Firestore test successful");
        
    } catch (error) {
        console.error("❌ Firestore connection test failed:", error);
        
        // Show helpful error messages
        switch (error.code) {
            case 'permission-denied':
                console.error("💡 Firestore Rules Issue. Go to Firebase Console → Firestore Database → Rules tab and set:");
                console.error("rules_version = '2';");
                console.error("service cloud.firestore {");
                console.error("  match /databases/{database}/documents {");
                console.error("    match /{document=**} {");
                console.error("      allow read, write: if true;");
                console.error("    }");
                console.error("  }");
                console.error("}");
                break;
            case 'unavailable':
                console.error("💡 Firestore is unavailable. Check internet connection.");
                break;
            case 'failed-precondition':
                console.error("💡 Firestore not enabled. Enable it in Firebase Console.");
                break;
            default:
                console.error("💡 Unknown error. Check Firebase Console project status.");
        }
    }
}

// Request Notification Permission
function requestNotificationPermission() {
    if (!messaging) {
        console.log("Messaging not available");
        return;
    }
    
    console.log("Requesting notification permission...");
    Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
            console.log('Notification permission granted.');
            getFCMToken();
        } else {
            console.log('Unable to get permission to notify.');
        }
    }).catch((err) => {
        console.error('Error requesting notification permission:', err);
    });
}

// Get FCM Token
function getFCMToken() {
    if (!messaging) {
        console.log("Messaging not available for token");
        return;
    }
    
    messaging.getToken({ vapidKey: 'BCMEhQHZvwuii0Pul11PRfM68N_C4iox9c6jUwWoj21lvKZ2hhAfRe-5KwG_A1xMsQ04aelb8XM7x-mXNYzak1o' })
        .then((currentToken) => {
            if (currentToken) {
                console.log('FCM Token:', currentToken);
                saveTokenToFirestore(currentToken);
            } else {
                console.log('No registration token available.');
            }
        })
        .catch((err) => {
            console.log('Error getting token:', err);
        });
}

// Save Token to Firestore
function saveTokenToFirestore(token) {
    if (!db) {
        console.log("Firestore not available to save token");
        return;
    }
    
    const currentUser = JSON.parse(localStorage.getItem('dutySystemSession'));
    if (!currentUser) {
        console.log("No user logged in to save token");
        return;
    }
    
    db.collection('fcmTokens').doc(currentUser.username).set({
        token: token,
        username: currentUser.username,
        name: currentUser.name,
        rcNo: currentUser.rcNo,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        lastActive: new Date().toISOString()
    }, { merge: true })
    .then(() => console.log('Token saved'))
    .catch(error => console.error('Error saving token:', error));
}

// Initialize Notifications
function initNotifications() {
    requestNotificationPermission();
}

// Update user last active
function updateUserLastActive() {
    if (!db) return;
    
    const currentUser = JSON.parse(localStorage.getItem('dutySystemSession'));
    if (currentUser) {
        db.collection('fcmTokens').doc(currentUser.username).update({
            lastActive: new Date().toISOString()
        }).catch(error => console.error('Error updating last active:', error));
    }
}

// Export Firebase instances for use in other files
window.firebaseApp = app;
window.firebaseDb = db;
window.firebaseMessaging = messaging;
window.firebaseAnalytics = analytics;

console.log("dcfire.js loaded successfully");
