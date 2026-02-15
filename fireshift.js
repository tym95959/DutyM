// ============================================
// FIREBASE CONFIGURATION - SHIFTS DATABASE
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyCMOPJnK_qpUZcHUWi6EQz-qclrNsDky3U",
  authDomain: "psysko-8d035.firebaseapp.com",
  projectId: "psysko-8d035",
  storageBucket: "psysko-8d035.firebasestorage.app",
  messagingSenderId: "176989826632",
  appId: "1:176989826632:web:bae58e639edbd8d4adf27d",
  measurementId: "G-XL5YJR6L74"
};

// Initialize Firebase for shifts (default app)
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

console.log("✅ Shifts Firebase initialized successfully!");
console.log("   Project: psysko-8d035");

// Make db available globally
window.db = db;

// ============================================
// FIREBASE CONFIGURATION - PASSENGER DATABASE
// ============================================

const firebaseConfigPassenger = {
  apiKey: "AIzaSyD4TFX53rGaZAzvZYWvHKpeDZljZNJS-Wg",
  authDomain: "atten-14f76.firebaseapp.com",
  projectId: "atten-14f76",
  storageBucket: "atten-14f76.firebasestorage.app",
  messagingSenderId: "1074869564190",
  appId: "1:1074869564190:web:eb5aa41259eab048ea8f0f",
  measurementId: "G-F3WGD68VC3"
};

// Initialize Firebase for passenger data with a named app "passengerApp"
const passengerApp = !firebase.apps.some(app => app.name === "passengerApp") ? 
    firebase.initializeApp(firebaseConfigPassenger, "passengerApp") :
    firebase.app("passengerApp");

// Firestore reference for passenger database
const passengerDb = passengerApp.firestore();

console.log("✅ Passenger Firebase initialized successfully!");
console.log("   Project: atten-14f76");

// Make passengerDb available globally
window.passengerDb = passengerDb;

// ============================================
// FIREBASE CONFIGURATION - CARD ENTRY DATABASE
// ============================================

const firebaseConfigCard = {
  apiKey: "AIzaSyBHaKvTQWmhEV6nS49f6UBIIl466cYlpew",
  authDomain: "cardentryqr.firebaseapp.com",
  projectId: "cardentryqr",
  storageBucket: "cardentryqr.firebasestorage.app",
  messagingSenderId: "444400598474",
  appId: "1:444400598474:web:acdd018ea29d3f13f6e333",
  measurementId: "G-DPRGDXFR3T"
};

// Initialize Firebase for card entry data with a named app "cardApp"
const cardApp = !firebase.apps.some(app => app.name === "cardApp") ? 
    firebase.initializeApp(firebaseConfigCard, "cardApp") :
    firebase.app("cardApp");

// Firestore reference for card entry database
const cardDb = cardApp.firestore();

console.log("✅ Card Entry Firebase initialized successfully!");
console.log("   Project: cardentryqr");

// Make cardDb available globally
window.cardDb = cardDb;

// ============================================
// EXPORT ALL THREE DATABASES
// ============================================

// Make all databases available globally
window.db = db;              // Shifts database (psysko-8d035)
window.passengerDb = passengerDb;  // Passenger database (atten-14f76)
window.cardDb = cardDb;      // Card entry database (cardentryqr)

