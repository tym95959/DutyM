// firebase-config.js
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
const storage = firebase.storage();

// Firestore collections
const Collections = {
    USERS: 'users_backup',
    ROSTERS: 'rosters',
    SICK_LEAVES: 'sick_leaves',
    FR_LEAVES: 'fr_leaves',
    DUTY_CHANGES: 'duty_changes',
    ANNOUNCEMENTS: 'announcements',
    ACTIVITY_LOGS: 'activity_logs',
    NOTIFICATIONS: 'notifications',
    SETTINGS: 'settings'
};

// Enable offline persistence
db.enablePersistence().catch((err) => {
    console.error('Firebase persistence error:', err.code);
});

// Helper functions
const dbHelper = {
    // Get current timestamp
    timestamp: () => firebase.firestore.FieldValue.serverTimestamp(),
    
    // Add document
    async add(collection, data) {
        try {
            const docRef = await db.collection(collection).add({
                ...data,
                createdAt: this.timestamp(),
                updatedAt: this.timestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error adding document:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Update document
    async update(collection, id, data) {
        try {
            await db.collection(collection).doc(id).update({
                ...data,
                updatedAt: this.timestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating document:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Delete document
    async delete(collection, id) {
        try {
            await db.collection(collection).doc(id).delete();
            return { success: true };
        } catch (error) {
            console.error('Error deleting document:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Get document by ID
    async getById(collection, id) {
        try {
            const doc = await db.collection(collection).doc(id).get();
            if (doc.exists) {
                return { success: true, data: { id: doc.id, ...doc.data() } };
            }
            return { success: false, error: 'Document not found' };
        } catch (error) {
            console.error('Error getting document:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Query documents
    async query(collection, conditions = [], orderBy = null, limit = null) {
        try {
            let query = db.collection(collection);
            
            // Apply conditions
            conditions.forEach(condition => {
                query = query.where(condition.field, condition.operator, condition.value);
            });
            
            // Apply ordering
            if (orderBy) {
                query = query.orderBy(orderBy.field, orderBy.direction || 'asc');
            }
            
            // Apply limit
            if (limit) {
                query = query.limit(limit);
            }
            
            const snapshot = await query.get();
            const results = [];
            snapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, data: results };
        } catch (error) {
            console.error('Error querying documents:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Real-time listener
    onSnapshot(collection, callback, conditions = [], orderBy = null) {
        let query = db.collection(collection);
        
        conditions.forEach(condition => {
            query = query.where(condition.field, condition.operator, condition.value);
        });
        
        if (orderBy) {
            query = query.orderBy(orderBy.field, orderBy.direction || 'asc');
        }
        
        return query.onSnapshot(snapshot => {
            const results = [];
            snapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });
            callback(results);
        });
    }
};

// Initialize default settings if not exists
async function initializeSettings() {
    const settingsRef = db.collection(Collections.SETTINGS).doc('system');
    const settingsDoc = await settingsRef.get();
    
    if (!settingsDoc.exists) {
        const defaultSettings = {
            appName: 'Leave Management System',
            companyName: 'Your Company',
            slMinHoursBefore: 2,
            frlMinHoursBefore: 1,
            allowBackdates: false,
            autoApproveLeaves: false,
            notificationEnabled: true,
            workStartTime: '08:00',
            workEndTime: '17:00',
            weekendDays: ['Friday', 'Saturday'],
            createdAt: dbHelper.timestamp(),
            updatedAt: dbHelper.timestamp()
        };
        
        await settingsRef.set(defaultSettings);
        console.log('Default settings initialized');
    }
}

// Run initialization
initializeSettings();

// Export
window.db = db;
window.dbHelper = dbHelper;
window.Collections = Collections;
