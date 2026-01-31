// Replace with your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAf_sjwVHG65vKhezpS_L7KC2j0WHIDaWc",
    authDomain: "leelidc-1f753.firebaseapp.com",
    projectId: "leelidc-1f753",
    storageBucket: "leelidc-1f753.firebasestorage.app",
    messagingSenderId: "43622932335",
    appId: "1:43622932335:web:a7529bce1f19714687129a",
    measurementId: "G-3KD6ZYS599"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const messaging = firebase.messaging();

// VAPID key for push notifications (from Firebase Console > Cloud Messaging)
const vapidKey = "YOUR_VAPID_KEY";
