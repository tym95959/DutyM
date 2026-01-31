// DOM Elements
let currentUser = null;
let userPreferences = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    checkAuthState();
    initializeNotifications();
});

// Firebase Auth
function checkAuthState() {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            document.getElementById('userEmail').textContent = user.email;
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('mainApp').style.display = 'block';
            loadUserData();
        } else {
            currentUser = null;
            document.getElementById('authSection').style.display = 'block';
            document.getElementById('mainApp').style.display = 'none';
        }
    });
}

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            await firebase.auth().createUserWithEmailAndPassword(email, password);
        } else {
            alert('Error: ' + error.message);
        }
    }
}

function logout() {
    firebase.auth().signOut();
}

// Pushup Logging
async function logPushups() {
    if (!currentUser) return;
    
    const count = parseInt(document.getElementById('pushupCount').value);
    if (!count || count < 1) {
        alert('Please enter a valid number');
        return;
    }
    
    const pushupData = {
        count: count,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userId: currentUser.uid,
        date: new Date().toISOString().split('T')[0]
    };
    
    try {
        await db.collection('pushups').add(pushupData);
        document.getElementById('pushupCount').value = '';
        loadUserData();
        showNotification(`Logged ${count} pushups! 💪`);
    } catch (error) {
        console.error('Error logging pushups:', error);
    }
}

function quickLog(count) {
    document.getElementById('pushupCount').value = count;
    logPushups();
}

async function loadUserData() {
    if (!currentUser) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's pushups
    const todaySnapshot = await db.collection('pushups')
        .where('userId', '==', currentUser.uid)
        .where('date', '==', today)
        .get();
    
    let todayCount = 0;
    todaySnapshot.forEach(doc => {
        todayCount += doc.data().count;
    });
    
    // Get all pushups
    const totalSnapshot = await db.collection('pushups')
        .where('userId', '==', currentUser.uid)
        .get();
    
    let totalCount = 0;
    totalSnapshot.forEach(doc => {
        totalCount += doc.data().count;
    });
    
    // Update UI
    document.getElementById('todayCount').textContent = todayCount;
    document.getElementById('totalCount').textContent = totalCount;
    
    // Load history
    loadHistory();
    
    // Load preferences
    loadPreferences();
}

async function loadHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    const snapshot = await db.collection('pushups')
        .where('userId', '==', currentUser.uid)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();
    
    snapshot.forEach(doc => {
        const data = doc.data();
        const date = new Date(data.timestamp?.toDate() || new Date());
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="history-count">${data.count} pushups</span>
            <span class="history-date">${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        `;
        historyList.appendChild(li);
    });
}

// Notifications
async function initializeNotifications() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            setupFirebaseMessaging();
        }
    }
}

function setupFirebaseMessaging() {
    // Request notification permission
    Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
            console.log('Notification permission granted.');
            
            // Get FCM token
            messaging.getToken({ vapidKey: vapidKey }).then((currentToken) => {
                if (currentToken) {
                    // Send token to server (save in Firestore)
                    if (currentUser) {
                        saveToken(currentToken);
                    }
                } else {
                    console.log('No registration token available.');
                }
            }).catch((err) => {
                console.log('An error occurred while retrieving token. ', err);
            });
            
            // Handle incoming messages
            messaging.onMessage((payload) => {
                console.log('Message received. ', payload);
                showNotification(payload.notification.body);
            });
        }
    });
}

async function saveToken(token) {
    if (!currentUser) return;
    
    await db.collection('fcmTokens').doc(currentUser.uid).set({
        token: token,
        userId: currentUser.uid,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}

async function scheduleReminder() {
    if (!currentUser) return;
    
    const time = document.getElementById('reminderTime').value;
    const enabled = document.getElementById('notificationToggle').checked;
    
    userPreferences = {
        reminderTime: time,
        notificationsEnabled: enabled,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('userPreferences').doc(currentUser.uid).set(userPreferences, { merge: true });
    
    alert('Reminder settings saved!');
}

async function loadPreferences() {
    const doc = await db.collection('userPreferences').doc(currentUser.uid).get();
    
    if (doc.exists) {
        userPreferences = doc.data();
        document.getElementById('reminderTime').value = userPreferences.reminderTime || '18:00';
        document.getElementById('notificationToggle').checked = userPreferences.notificationsEnabled || false;
    }
}

function showNotification(message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pushup Tracker', {
            body: message,
            icon: '/icon.png'
        });
    }
}

// Check for reminder time (this would be handled server-side, but for demo)
function checkReminder() {
    if (!userPreferences || !userPreferences.notificationsEnabled) return;
    
    const now = new Date();
    const [hours, minutes] = userPreferences.reminderTime.split(':');
    const reminderTime = new Date();
    reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    if (now.getHours() === reminderTime.getHours() && 
        now.getMinutes() === reminderTime.getMinutes()) {
        showNotification('Time for your daily pushups! 💪');
    }
}

// Check every minute
setInterval(checkReminder, 60000);
