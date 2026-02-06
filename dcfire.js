// dcfire.js - Fixed Version
(function() {
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
    
    // Check if Firebase is already initialized
    if (!firebase.apps.length) {
        // Initialize Firebase
        const app = firebase.initializeApp(firebaseConfig);
        window.firebaseApp = app;
        console.log('Firebase initialized successfully');
    } else {
        // Use existing app
        window.firebaseApp = firebase.app();
        console.log('Using existing Firebase app');
    }
    
    // Initialize Firestore
    window.db = firebase.firestore();
    window.firebaseConfig = firebaseConfig;
    
    console.log('Firebase services initialized');
})();
