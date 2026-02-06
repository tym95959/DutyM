// dcfire.js - Non-Module Version (Global Variables)
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
    
    // Initialize Firebase (using compatibility version)
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    // Initialize Firestore
    const db = firebase.firestore();
    
    // Make variables globally available
    window.firebaseConfig = firebaseConfig;
    window.db = db;
    window.firebaseApp = firebase.app();
    
    console.log('Firebase initialized successfully');
})();
