// Load saved configuration
let firebaseConfig = JSON.parse(localStorage.getItem('firebaseConfig')) || {};
let fcmToken = null;

// Populate form with saved config
window.onload = function() {
    if (firebaseConfig.apiKey) {
        document.getElementById('apiKey').value = firebaseConfig.apiKey || '';
        document.getElementById('authDomain').value = firebaseConfig.authDomain || '';
        document.getElementById('projectId').value = firebaseConfig.projectId || '';
        document.getElementById('storageBucket').value = firebaseConfig.storageBucket || '';
        document.getElementById('messagingSenderId').value = firebaseConfig.messagingSenderId || '';
        document.getElementById('appId').value = firebaseConfig.appId || '';
        document.getElementById('vapidKey').value = firebaseConfig.vapidKey || '';
    }
    
    checkNotificationPermission();
};

// Save configuration
function saveConfig() {
    firebaseConfig = {
        apiKey: document.getElementById('apiKey').value,
        authDomain: document.getElementById('authDomain').value,
        projectId: document.getElementById('projectId').value,
        storageBucket: document.getElementById('storageBucket').value,
        messagingSenderId: document.getElementById('messagingSenderId').value,
        appId: document.getElementById('appId').value,
        vapidKey: document.getElementById('vapidKey').value
    };
    
    localStorage.setItem('firebaseConfig', JSON.stringify(firebaseConfig));
    logDebug('Configuration saved!');
    alert('Configuration saved successfully!');
}

// Check notification permission
function checkNotificationPermission() {
    if (!('Notification' in window)) {
        updatePermissionStatus('Notifications not supported', 'error');
        return;
    }
    
    if (Notification.permission === 'granted') {
        updatePermissionStatus('Notification permission: Granted', 'success');
        document.getElementById('permissionBtn').disabled = true;
    } else if (Notification.permission === 'denied') {
        updatePermissionStatus('Notification permission: Denied', 'error');
        document.getElementById('permissionBtn').disabled = false;
    } else {
        updatePermissionStatus('Notification permission: Default (Ask)', 'info');
        document.getElementById('permissionBtn').disabled = false;
    }
}

// Request notification permission
function requestPermission() {
    if (!('Notification' in window)) {
        logDebug('This browser does not support notifications');
        return;
    }
    
    Notification.requestPermission().then((permission) => {
        updatePermissionStatus(`Notification permission: ${permission}`, 
            permission === 'granted' ? 'success' : 
            permission === 'denied' ? 'error' : 'info');
        
        if (permission === 'granted') {
            document.getElementById('permissionBtn').disabled = true;
            logDebug('Notification permission granted!');
        }
    });
}

// Initialize Firebase
function initializeFirebase() {
    if (!firebaseConfig.apiKey) {
        logDebug('Please configure Firebase first!', 'error');
        return;
    }
    
    try {
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        
        // Initialize Firebase Cloud Messaging
        const messaging = firebase.messaging();
        
        // Register service worker
        navigator.serviceWorker.register('firebase-messaging-sw.js')
            .then((registration) => {
                logDebug('Service Worker registered:', registration);
                
                // Use the service worker registration
                messaging.useServiceWorker(registration);
                
                // Request permission and get token
                messaging.requestPermission()
                    .then(() => {
                        updateFirebaseStatus('Firebase Messaging: Initialized successfully', 'success');
                        logDebug('Firebase Messaging initialized');
                    })
                    .catch((error) => {
                        updateFirebaseStatus('Firebase Messaging: Permission denied', 'error');
                        logDebug('Permission error:', error);
                    });
                
                // Handle background messages
                messaging.onBackgroundMessage((payload) => {
                    logDebug('Background message received:', payload);
                    
                    // Customize notification here
                    const notificationTitle = payload.notification.title;
                    const notificationOptions = {
                        body: payload.notification.body,
                        icon: 'icon.png'
                    };
                    
                    self.registration.showNotification(notificationTitle, notificationOptions);
                });
                
                // Handle foreground messages
                messaging.onMessage((payload) => {
                    logDebug('Foreground message received:', payload);
                    
                    // Show notification when app is in foreground
                    if (Notification.permission === 'granted') {
                        new Notification(payload.notification.title, {
                            body: payload.notification.body,
                            icon: 'icon.png'
                        });
                    }
                });
            })
            .catch((error) => {
                updateFirebaseStatus('Service Worker registration failed', 'error');
                logDebug('Service Worker registration failed:', error);
            });
            
    } catch (error) {
        updateFirebaseStatus('Firebase initialization failed', 'error');
        logDebug('Firebase initialization error:', error);
    }
}

// Get FCM Token
function getToken() {
    if (!firebase.apps.length) {
        logDebug('Firebase not initialized. Please initialize first.', 'error');
        return;
    }
    
    const messaging = firebase.messaging();
    
    messaging.getToken({ vapidKey: firebaseConfig.vapidKey })
        .then((currentToken) => {
            if (currentToken) {
                fcmToken = currentToken;
                updateTokenStatus('FCM Token: Retrieved successfully', 'success');
                logDebug('FCM Token:', currentToken);
                
                // Display token (first 50 chars)
                const displayToken = currentToken.length > 50 ? 
                    currentToken.substring(0, 50) + '...' : currentToken;
                document.getElementById('tokenStatus').innerHTML = 
                    `FCM Token: <br><small>${displayToken}</small>`;
            } else {
                updateTokenStatus('No registration token available', 'error');
                logDebug('No registration token available');
            }
        })
        .catch((error) => {
            updateTokenStatus('Token retrieval failed', 'error');
            logDebug('Error retrieving token:', error);
        });
}

// Copy token to clipboard
function copyToken() {
    if (!fcmToken) {
        alert('No token to copy. Please get token first.');
        return;
    }
    
    navigator.clipboard.writeText(fcmToken)
        .then(() => {
            alert('Token copied to clipboard!');
            logDebug('Token copied to clipboard');
        })
        .catch((error) => {
            logDebug('Failed to copy token:', error);
        });
}

// Send test notification
function sendTestNotification() {
    if (!fcmToken) {
        alert('Please get FCM token first.');
        return;
    }
    
    const title = document.getElementById('notificationTitle').value;
    const body = document.getElementById('notificationBody').value;
    
    // This would typically be sent from your server
    // For testing, we'll simulate it with a local notification
    if (Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: 'icon.png'
        });
        logDebug('Test notification sent locally');
    } else {
        alert('Notification permission not granted');
    }
}

// Utility functions
function updatePermissionStatus(message, type) {
    const element = document.getElementById('permissionStatus');
    element.textContent = message;
    element.className = `status-box ${type}`;
}

function updateFirebaseStatus(message, type) {
    const element = document.getElementById('firebaseStatus');
    element.textContent = message;
    element.className = `status-box ${type}`;
}

function updateTokenStatus(message, type) {
    const element = document.getElementById('tokenStatus');
    element.textContent = message;
    element.className = `status-box ${type}`;
}

function logDebug(message, type = 'info') {
    const debugDiv = document.getElementById('debugInfo');
    const timestamp = new Date().toLocaleTimeString();
    const messageStr = typeof message === 'object' ? JSON.stringify(message, null, 2) : message;
    
    debugDiv.innerHTML += `<div class="debug-entry ${type}">
        <strong>[${timestamp}]</strong> ${messageStr}
    </div><br>`;
}

function clearDebug() {
    document.getElementById('debugInfo').innerHTML = '';
}
