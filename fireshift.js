// ============================================
// MULTI-FIREBASE CONFIGURATION
// ============================================

// ============================================
// 1. SHIFTS DATABASE (Default App)
// ============================================
const firebaseConfigShifts = {
  apiKey: "AIzaSyCMOPJnK_qpUZcHUWi6EQz-qclrNsDky3U",
  authDomain: "psysko-8d035.firebaseapp.com",
  projectId: "psysko-8d035",
  storageBucket: "psysko-8d035.firebasestorage.app",
  messagingSenderId: "176989826632",
  appId: "1:176989826632:web:bae58e639edbd8d4adf27d",
  measurementId: "G-XL5YJR6L74"
};

// Initialize Firebase for shifts (default app)
const app = firebase.initializeApp(firebaseConfigShifts);
const db = firebase.firestore();

console.log("✅ Shifts Firebase initialized successfully!");
console.log("   Project: psysko-8d035");

// ============================================
// 2. PASSENGER DATABASE (atten-14f76)
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

// ============================================
// 3. BA (British Airways) DATABASE
// ============================================
const firebaseConfigBA = {
  apiKey: "AIzaSyBOYHPBWJZkmHxxPX3ej4jvAkTNAKtTWjE",
  authDomain: "cardentryba.firebaseapp.com",
  projectId: "cardentryba",
  storageBucket: "cardentryba.firebasestorage.app",
  messagingSenderId: "840992358430",
  appId: "1:840992358430:web:bb44ed57028ff498ddee0f",
  measurementId: "G-C4BTGQLRPQ"
};

// Initialize Firebase for BA flights with a named app "baApp"
const baApp = !firebase.apps.some(app => app.name === "baApp") ? 
    firebase.initializeApp(firebaseConfigBA, "baApp") :
    firebase.app("baApp");

// Firestore reference for BA database
const baDb = baApp.firestore();

console.log("✅ BA Firebase initialized successfully!");
console.log("   Project: cardentryba");

// ============================================
// 4. EK (Emirates) DATABASE
// ============================================
const firebaseConfigEK = {
  apiKey: "AIzaSyCZsVAtTYackUUQ6GufFA4XWaeTZdNN7rg",
  authDomain: "cardentryek.firebaseapp.com",
  projectId: "cardentryek",
  storageBucket: "cardentryek.firebasestorage.app",
  messagingSenderId: "164080373592",
  appId: "1:164080373592:web:073b3b345530788ebc9f2d",
  measurementId: "G-7ZTBCN488F"
};

// Initialize Firebase for EK flights with a named app "ekApp"
const ekApp = !firebase.apps.some(app => app.name === "ekApp") ? 
    firebase.initializeApp(firebaseConfigEK, "ekApp") :
    firebase.app("ekApp");

// Firestore reference for EK database
const ekDb = ekApp.firestore();

console.log("✅ EK Firebase initialized successfully!");
console.log("   Project: cardentryek");

// ============================================
// 5. QR (Qatar Airways) DATABASE
// ============================================
const firebaseConfigQR = {
  apiKey: "AIzaSyBHaKvTQWmhEV6nS49f6UBIIl466cYlpew",
  authDomain: "cardentryqr.firebaseapp.com",
  projectId: "cardentryqr",
  storageBucket: "cardentryqr.firebasestorage.app",
  messagingSenderId: "444400598474",
  appId: "1:444400598474:web:acdd018ea29d3f13f6e333",
  measurementId: "G-DPRGDXFR3T"
};

// Initialize Firebase for QR flights with a named app "qrApp"
const qrApp = !firebase.apps.some(app => app.name === "qrApp") ? 
    firebase.initializeApp(firebaseConfigQR, "qrApp") :
    firebase.app("qrApp");

// Firestore reference for QR database
const qrDb = qrApp.firestore();

console.log("✅ QR Firebase initialized successfully!");
console.log("   Project: cardentryqr");

// ============================================
// 6. SQ (Singapore Airlines) DATABASE
// ============================================
const firebaseConfigSQ = {
  apiKey: "AIzaSyCvTa6Pmmm1tMAl5j0GxVeMsE6hBtH_56A",
  authDomain: "dcleeli.firebaseapp.com",
  projectId: "dcleeli",
  storageBucket: "dcleeli.firebasestorage.app",
  messagingSenderId: "271150919213",
  appId: "1:271150919213:web:6f9d001e4a7c66cbff12a4",
  measurementId: "G-JK126NVJ8B"
};

// Initialize Firebase for SQ flights with a named app "sqApp"
const sqApp = !firebase.apps.some(app => app.name === "sqApp") ? 
    firebase.initializeApp(firebaseConfigSQ, "sqApp") :
    firebase.app("sqApp");

// Firestore reference for SQ database
const sqDb = sqApp.firestore();

console.log("✅ SQ Firebase initialized successfully!");
console.log("   Project: dcleeli");

// ============================================
// 7. DEFAULT CARD ENTRY DATABASE
// ============================================
const firebaseConfigDefaultCard = {
  apiKey: "AIzaSyCLme7iTKJgek-jI7HIM-978Ln2i2w5E5A",
  authDomain: "cardentry-7bad1.firebaseapp.com",
  projectId: "cardentry-7bad1",
  storageBucket: "cardentry-7bad1.firebasestorage.app",
  messagingSenderId: "501968962957",
  appId: "1:501968962957:web:2b1588b3968688d35669c4",
  measurementId: "G-Y5NGGZ4WXD"
};

// Initialize Firebase for default card entry with a named app "defaultCardApp"
const defaultCardApp = !firebase.apps.some(app => app.name === "defaultCardApp") ? 
    firebase.initializeApp(firebaseConfigDefaultCard, "defaultCardApp") :
    firebase.app("defaultCardApp");

// Firestore reference for default card entry database
const defaultCardDb = defaultCardApp.firestore();

console.log("✅ Default Card Entry Firebase initialized successfully!");
console.log("   Project: cardentry-7bad1");

// ============================================
// HELPER FUNCTION: Get Firebase DB based on flight number
// ============================================

/**
 * Returns the appropriate Firestore database based on flight number
 * @param {string} flightNo - The flight number (e.g., "BA123", "EK456")
 * @returns {Object} - The Firestore database instance
 */
function getFirestoreForFlight(flightNo) {
  if (!flightNo || typeof flightNo !== 'string') {
    console.log("No valid flight number provided, using default database");
    return defaultCardDb;
  }

  const flightPrefix = flightNo.substring(0, 2).toUpperCase();
  
  switch(flightPrefix) {
    case 'BA':
      console.log(`✈️ BA flight detected (${flightNo}) - using BA database`);
      return baDb;
      
    case 'EK':
      console.log(`✈️ EK flight detected (${flightNo}) - using EK database`);
      return ekDb;
      
    case 'QR':
      console.log(`✈️ QR flight detected (${flightNo}) - using QR database`);
      return qrDb;
      
    case 'SQ':
      console.log(`✈️ SQ flight detected (${flightNo}) - using SQ database`);
      return sqDb;
      
    default:
      console.log(`✈️ Other flight detected (${flightNo}) - using default database`);
      return defaultCardDb;
  }
}

/**
 * Saves an entry to the appropriate Firebase database based on flight number
 * @param {Object} entry - The entry to save
 * @returns {Promise} - The save operation promise
 */
async function saveEntryToFlightDatabase(entry) {
  try {
    if (!entry || !entry.flightNo) {
      throw new Error("Entry or flight number missing");
    }

    // Get the appropriate database for this flight
    const targetDb = getFirestoreForFlight(entry.flightNo);
    
    // Prepare the data (remove local-only fields)
    const firebaseData = { ...entry };
    delete firebaseData.id;
    delete firebaseData.firebaseStatus;
    delete firebaseData.firebaseSaved;
    delete firebaseData.firebaseRetry;
    delete firebaseData.firebaseError;
    delete firebaseData.firebaseReason;
    
    // Add server timestamp
    firebaseData.savedAt = firebase.firestore.FieldValue.serverTimestamp();
    
    // Save to the appropriate collection (using 'KoveliPass' as collection name)
    const collectionRef = targetDb.collection('KoveliPass');
    const docRef = await collectionRef.add(firebaseData);
    
    console.log(`✅ Entry saved to ${entry.flightNo} database with ID:`, docRef.id);
    console.log(`   Database: ${getFirestoreNameForFlight(entry.flightNo)}`);
    
    return { 
      success: true, 
      docId: docRef.id,
      database: getFirestoreNameForFlight(entry.flightNo)
    };
    
  } catch (error) {
    console.error(`❌ Error saving to ${entry.flightNo} database:`, error);
    return { 
      success: false, 
      error: error.message,
      database: getFirestoreNameForFlight(entry.flightNo)
    };
  }
}

/**
 * Gets the friendly name of the database for a flight
 * @param {string} flightNo - The flight number
 * @returns {string} - The database name
 */
function getFirestoreNameForFlight(flightNo) {
  if (!flightNo || typeof flightNo !== 'string') return "Default Database";
  
  const flightPrefix = flightNo.substring(0, 2).toUpperCase();
  
  switch(flightPrefix) {
    case 'BA': return "BA Database (cardentryba)";
    case 'EK': return "EK Database (cardentryek)";
    case 'QR': return "QR Database (cardentryqr)";
    case 'SQ': return "SQ Database (dcleeli)";
    default: return "Default Database (cardentry-7bad1)";
  }
}

// ============================================
// EXPORT ALL DATABASES AND HELPER FUNCTIONS
// ============================================

// Make all databases available globally
window.db = db;                      // Shifts database (psysko-8d035)
window.passengerDb = passengerDb;    // Passenger database (atten-14f76)

// Flight-specific databases
window.baDb = baDb;                  // BA database (cardentryba)
window.ekDb = ekDb;                  // EK database (cardentryek)
window.qrDb = qrDb;                  // QR database (cardentryqr)
window.sqDb = sqDb;                  // SQ database (dcleeli)
window.defaultCardDb = defaultCardDb; // Default card database (cardentry-7bad1)

// Helper functions
window.getFirestoreForFlight = getFirestoreForFlight;
window.saveEntryToFlightDatabase = saveEntryToFlightDatabase;
window.getFirestoreNameForFlight = getFirestoreNameForFlight;

console.log("✅ All Firebase databases initialized successfully!");
console.log("==========================================");
console.log("Available databases:");
console.log("1. Shifts DB: psysko-8d035");
console.log("2. Passenger DB: atten-14f76");
console.log("3. BA DB: cardentryba");
console.log("4. EK DB: cardentryek");
console.log("5. QR DB: cardentryqr");
console.log("6. SQ DB: dcleeli");
console.log("7. Default Card DB: cardentry-7bad1");
console.log("==========================================");
