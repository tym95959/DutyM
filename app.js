let currentToken = null;

// Check notification permission
function checkNotificationPermission() {
    const statusDiv = document.getElementById('notification-status');
    
    if (!('Notification' in window)) {
        statusDiv.innerHTML = '<p class="error">This browser does not support notifications</p>';
        return;
    }
    
    if (Notification.permission === 'granted') {
        statusDiv.innerHTML = '<p class="success">Notifications are enabled!</p>';
        initializeFirebaseMessaging();
        return;
    }
    
    if (Notification.permission === 'denied') {
        statusDiv.innerHTML = '<p class="error">Notifications are blocked. Please enable them in browser settings.</p>';
        return;
    }
    
    statusDiv.innerHTML = '<p>Notifications are not yet enabled. Click the button below.</p>';
}

// Request notification permission
async function requestPermission() {
    try {
        const permission = await Notification.requestPermission();
        const statusDiv = document.getElementById('notification-status');
        
        if (permission === 'granted') {
            statusDiv.innerHTML = '<p class="success">Permission granted! Setting up notifications...</p>';
            await initializeFirebaseMessaging();
        } else {
            statusDiv.innerHTML = '<p class="error">Permission denied.</p>';
        }
    } catch (error) {
        console.error('Error requesting permission:', error);
        document.getElementById('notification-status').innerHTML = 
            `<p class="error">Error: ${error.message}</p>`;
    }
}

// Initialize Firebase Messaging
async function initializeFirebaseMessaging() {
    try {
        // Request notification permission
        await messaging.requestPermission();
        
        // Get FCM token
        currentToken = await messaging.getToken({
            vapidKey: 'YOUR_VAPID_KEY' // Get this from Firebase Console
        });
        
        if (currentToken) {
            // Display token
            document.getElementById('fcm-token').textContent = currentToken;
            document.getElementById('fcm-token-container').style.display = 'block';
            document.getElementById('send-test').disabled = false;
            
            // Generate cURL command
            const webhookUrl = document.getElementById('webhook-url').value || 
                              'https://your-api.vercel.app/api/send-notification';
            document.getElementById('curl-command').textContent = 
`curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "${currentToken}",
    "title": "Test Notification",
    "body": "Hello from cURL!",
    "url": "https://example.com"
  }'`;
            
            // Update status
            document.getElementById('notification-status').innerHTML = 
                '<p class="success">Firebase Messaging initialized successfully!</p>';
            
            // Listen for incoming messages
            setupMessageHandlers();
        } else {
            document.getElementById('notification-status').innerHTML = 
                '<p class="error">No registration token available.</p>';
        }
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        document.getElementById('notification-status').innerHTML = 
            `<p class="error">Error: ${error.message}</p>`;
    }
}

// Setup message handlers
function setupMessageHandlers() {
    // Handle foreground messages
    messaging.onMessage((payload) => {
        console.log('Message received:', payload);
        
        const notificationTitle = payload.notification.title;
        const notificationOptions = {
            body: payload.notification.body,
            icon: '/icon.png',
            data: payload.data || {}
        };
        
        // Show notification
        if (Notification.permission === 'granted') {
            const notification = new Notification(notificationTitle, notificationOptions);
            
            // Handle notification click
            notification.onclick = function(event) {
                event.preventDefault();
                if (payload.data.url) {
                    window.open(payload.data.url, '_blank');
                }
                notification.close();
            };
        }
    });
    
    // Handle token refresh
    messaging.onTokenRefresh(async () => {
        try {
            const newToken = await messaging.getToken();
            currentToken = newToken;
            document.getElementById('fcm-token').textContent = newToken;
            console.log('Token refreshed:', newToken);
        } catch (error) {
            console.error('Error refreshing token:', error);
        }
    });
}

// Send test notification
async function sendTestNotification() {
    if (!currentToken) {
        alert('No token available. Please enable notifications first.');
        return;
    }
    
    try {
        const response = await fetch('/api/send-notification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: currentToken,
                title: 'Test Notification',
                body: 'This is a test notification from the web app!',
                url: window.location.href
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert('Test notification sent successfully!');
        } else {
            alert('Error: ' + (result.error || 'Failed to send notification'));
        }
    } catch (error) {
        alert('Error sending notification: ' + error.message);
    }
}

// Send notification via webhook
async function sendViaWebhook() {
    const webhookUrl = document.getElementById('webhook-url').value;
    const title = document.getElementById('notification-title').value;
    const body = document.getElementById('notification-body').value;
    const url = document.getElementById('notification-url').value;
    
    if (!webhookUrl) {
        alert('Please enter a webhook URL');
        return;
    }
    
    if (!currentToken) {
        alert('No token available. Please enable notifications first.');
        return;
    }
    
    const statusDiv = document.getElementById('webhook-status');
    statusDiv.style.display = 'block';
    statusDiv.className = 'status info';
    statusDiv.innerHTML = '<p>Sending notification...</p>';
    
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: currentToken,
                title: title,
                body: body,
                url: url || null,
                timestamp: new Date().toISOString()
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            statusDiv.className = 'status success';
            statusDiv.innerHTML = `<p>Notification sent successfully!</p>
                                  <pre>${JSON.stringify(result, null, 2)}</pre>`;
        } else {
            statusDiv.className = 'status error';
            statusDiv.innerHTML = `<p>Error: ${result.error || 'Failed to send'}</p>
                                  <pre>${JSON.stringify(result, null, 2)}</pre>`;
        }
    } catch (error) {
        statusDiv.className = 'status error';
        statusDiv.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

// Copy token to clipboard
function copyToken() {
    const token = document.getElementById('fcm-token').textContent;
    navigator.clipboard.writeText(token).then(() => {
        alert('Token copied to clipboard!');
    }).catch(err => {
        console.error('Could not copy text: ', err);
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    checkNotificationPermission();
    
    // Auto-generate webhook URL if on Vercel
    if (window.location.hostname.includes('vercel.app')) {
        const baseUrl = window.location.origin;
        document.getElementById('webhook-url').value = `${baseUrl}/api/send-notification`;
    }
});
