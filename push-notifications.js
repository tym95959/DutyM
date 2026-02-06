// push-notifications.js
class PushNotificationManager {
    constructor() {
        this.fcmToken = null;
        this.messaging = null;
        this.isInitialized = false;
        this.isPermissionGranted = false;
        this.config = null;
        this.notificationSettings = {
            dutyChanges: true,
            leaveApprovals: true,
            announcements: true,
            systemAlerts: true
        };
        this.serviceWorkerRegistration = null;
    }

    // Initialize on page load
    async init() {
        // Load user settings
        this.loadNotificationSettings();
        
        // Initialize after user logs in
        // This will be called from main app after login
    }

    // Load Firebase config from Firestore
    async loadFirebaseConfig() {
        try {
            if (typeof db === 'undefined') {
                console.error('Firebase Firestore not initialized');
                return false;
            }
            
            const doc = await db.collection('systemConfig').doc('firebase').get();
            if (doc.exists && doc.data().apiKey) {
                this.config = doc.data();
                console.log('Firebase config loaded:', this.config.projectId);
                return true;
            } else {
                console.log('Firebase config not found in Firestore');
                return false;
            }
        } catch (error) {
            console.error('Error loading Firebase config:', error);
            return false;
        }
    }

    // Check and request notification permission
    async checkNotificationPermission() {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            this.isPermissionGranted = false;
            return false;
        }

        if (Notification.permission === 'granted') {
            this.isPermissionGranted = true;
            console.log('Notification permission already granted');
            return true;
        } else if (Notification.permission === 'denied') {
            console.log('Notification permission denied');
            this.isPermissionGranted = false;
            return false;
        } else {
            try {
                const permission = await Notification.requestPermission();
                this.isPermissionGranted = permission === 'granted';
                console.log('Notification permission requested:', permission);
                return this.isPermissionGranted;
            } catch (error) {
                console.error('Error requesting notification permission:', error);
                return false;
            }
        }
    }

    // Register service worker
    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.log('Service workers not supported');
            return null;
        }

        try {
            this.serviceWorkerRegistration = await navigator.serviceWorker.register('firebase-messaging-sw.js', {
                scope: './',
                updateViaCache: 'none'
            });
            
            console.log('Service Worker registered:', this.serviceWorkerRegistration);
            
            // Listen for service worker updates
            this.serviceWorkerRegistration.addEventListener('updatefound', () => {
                const newWorker = this.serviceWorkerRegistration.installing;
                console.log('New Service Worker installing:', newWorker);
            });
            
            return this.serviceWorkerRegistration;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            return null;
        }
    }

    // Initialize Firebase Messaging
    async initialize() {
        if (this.isInitialized) {
            console.log('Push notifications already initialized');
            return true;
        }

        try {
            // Check permission first
            const hasPermission = await this.checkNotificationPermission();
            if (!hasPermission) {
                console.log('Notification permission not granted');
                return false;
            }

            // Load Firebase config
            const hasConfig = await this.loadFirebaseConfig();
            if (!hasConfig || !this.config) {
                console.log('Firebase config not available');
                showToast('Push notifications not configured. Please contact administrator.', 'warning');
                return false;
            }

            // Initialize Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(this.config);
                console.log('Firebase app initialized');
            }

            // Get messaging instance
            this.messaging = firebase.messaging();
            console.log('Firebase Messaging initialized');

            // Register service worker
            const registration = await this.registerServiceWorker();
            if (!registration) {
                throw new Error('Service Worker registration failed');
            }

            // Use the service worker
            this.messaging.useServiceWorker(registration);

            // Get FCM token
            this.fcmToken = await this.getToken();
            
            // Save token to user's profile
            if (this.fcmToken && currentUser) {
                await this.saveTokenToProfile(this.fcmToken);
            }

            // Set up message listeners
            this.setupMessageListeners();
            
            // Send config to service worker
            await this.sendConfigToServiceWorker();

            this.isInitialized = true;
            console.log('Push notifications initialized successfully');
            
            // Show success message
            showToast('Push notifications enabled ✓', 'success');
            
            return true;
        } catch (error) {
            console.error('Error initializing push notifications:', error);
            showToast('Failed to enable push notifications', 'error');
            return false;
        }
    }

    // Get FCM token
    async getToken() {
        try {
            if (!this.messaging) {
                throw new Error('Messaging not initialized');
            }

            const token = await this.messaging.getToken({ 
                vapidKey: this.config.vapidKey,
                serviceWorkerRegistration: this.serviceWorkerRegistration
            });
            
            if (token) {
                console.log('FCM Token obtained:', token.substring(0, 20) + '...');
                return token;
            } else {
                console.log('No registration token available');
                return null;
            }
        } catch (error) {
            console.error('Error getting FCM token:', error);
            
            // Check specific errors
            if (error.code === 'messaging/permission-blocked') {
                showToast('Notifications blocked by browser. Please enable in settings.', 'warning');
            } else if (error.code === 'messaging/permission-default') {
                showToast('Please allow notifications when prompted.', 'info');
            }
            
            return null;
        }
    }

    // Save token to user's profile in Firestore
    async saveTokenToProfile(token) {
        try {
            if (!currentUser || !token) return;
            
            await db.collection('userTokens').doc(currentUser.username).set({
                token: token,
                username: currentUser.username,
                name: currentUser.name,
                rcNo: currentUser.rcNo,
                level: currentUser.level,
                lastUpdated: new Date().toISOString(),
                settings: this.notificationSettings,
                userAgent: navigator.userAgent,
                platform: navigator.platform
            }, { merge: true });
            
            console.log('Token saved to profile');
        } catch (error) {
            console.error('Error saving token:', error);
        }
    }

    // Send config to service worker
    async sendConfigToServiceWorker() {
        if (!this.serviceWorkerRegistration || !this.config) return;
        
        try {
            const serviceWorker = this.serviceWorkerRegistration.active;
            if (serviceWorker) {
                serviceWorker.postMessage({
                    type: 'UPDATE_FIREBASE_CONFIG',
                    config: this.config
                });
                console.log('Config sent to Service Worker');
            }
        } catch (error) {
            console.error('Error sending config to Service Worker:', error);
        }
    }

    // Setup message listeners
    setupMessageListeners() {
        if (!this.messaging) return;

        // Foreground messages
        this.messaging.onMessage((payload) => {
            console.log('Foreground message received:', payload);
            
            // Check if user wants this type of notification
            if (!this.shouldShowNotification(payload.data?.type)) {
                console.log('Notification filtered by user settings');
                return;
            }
            
            // Show in-app notification
            this.showInAppNotification(payload);
            
            // Also show browser notification if permission granted
            if (this.isPermissionGranted) {
                this.showBrowserNotification(payload);
            }
        });

        // Token refresh
        this.messaging.onTokenRefresh(async () => {
            console.log('Token refreshing...');
            const newToken = await this.getToken();
            if (newToken && currentUser) {
                this.fcmToken = newToken;
                await this.saveTokenToProfile(newToken);
                console.log('Token refreshed and saved');
            }
        });
    }

    // Check if should show notification based on user settings
    shouldShowNotification(type) {
        switch(type) {
            case 'duty_change_request':
            case 'duty_change_response':
                return this.notificationSettings.dutyChanges;
            case 'leave_request':
            case 'leave_approval':
                return this.notificationSettings.leaveApprovals;
            case 'announcement':
                return this.notificationSettings.announcements;
            case 'system_alert':
            case 'test':
                return this.notificationSettings.systemAlerts;
            default:
                return true;
        }
    }

    // Show in-app notification (toast)
    showInAppNotification(payload) {
        const title = payload.notification?.title || 'New Notification';
        const body = payload.notification?.body || '';
        const type = payload.data?.type || 'info';
        
        let toastType = 'info';
        if (type.includes('success') || type.includes('approved')) toastType = 'success';
        if (type.includes('error') || type.includes('rejected')) toastType = 'error';
        if (type.includes('warning')) toastType = 'warning';
        
        showToast(`${title}: ${body}`, toastType);
    }

    // Show browser notification
    showBrowserNotification(payload) {
        const title = payload.notification?.title || 'Duty Manager';
        const body = payload.notification?.body || 'New notification';
        
        const options = {
            body: body,
            icon: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%233498db\'/%3E%3Ccircle cx=\'50\' cy=\'35\' r=\'12\' fill=\'white\'/%3E%3Cpath d=\'M50,55 C65,55 70,70 70,70 L30,70 C30,70 35,55 50,55 Z\' fill=\'white\'/%3E%3Cpath d=\'M35,75 L65,75 L65,85 C65,90 60,95 50,95 C40,95 35,90 35,85 Z\' fill=\'white\'/%3E%3Cpath d=\'M20,20 L20,40 L30,30 Z\' fill=\'%2327ae60\'/%3E%3C/svg%3E',
            badge: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%233498db\'/%3E%3C/svg%3E',
            data: payload.data || {},
            tag: payload.data?.type || 'general',
            renotify: true,
            timestamp: Date.now()
        };
        
        if (Notification.permission === 'granted') {
            const notification = new Notification(title, options);
            
            // Handle click
            notification.onclick = (event) => {
                event.preventDefault();
                window.focus();
                notification.close();
                
                // Navigate based on notification type
                if (payload.data?.requestId) {
                    showSection('myRequests');
                } else if (payload.data?.type === 'announcement') {
                    showSection('home');
                }
            };
        }
    }

    // Send notification to specific user
    async sendNotificationToUser(username, title, body, data = {}) {
        try {
            if (!this.isInitialized) {
                console.log('Push notifications not initialized');
                return false;
            }

            // Get user's token from Firestore
            const tokenDoc = await db.collection('userTokens').doc(username).get();
            if (!tokenDoc.exists) {
                console.log('User token not found:', username);
                return false;
            }

            const userData = tokenDoc.data();
            
            // Check if user has notifications enabled for this type
            if (userData.settings && !this.shouldShowNotification(data.type)) {
                console.log('User has disabled notifications for this type:', data.type);
                return false;
            }

            // Store notification in Firestore (server would send actual push)
            await db.collection('notifications').add({
                toUsername: username,
                title: title,
                body: body,
                data: data,
                read: false,
                createdAt: new Date().toISOString(),
                sentAt: new Date().toISOString()
            });

            console.log(`Notification stored for ${username}: ${title}`);
            
            // If it's for current user, show local notification
            if (currentUser && currentUser.username === username) {
                const payload = {
                    notification: { title, body },
                    data: data
                };
                this.showInAppNotification(payload);
                
                if (this.isPermissionGranted) {
                    this.showBrowserNotification(payload);
                }
            }

            return true;
        } catch (error) {
            console.error('Error sending notification:', error);
            return false;
        }
    }

    // Send notification to multiple users
    async sendNotificationToUsers(usernames, title, body, data = {}) {
        try {
            const promises = usernames.map(username => 
                this.sendNotificationToUser(username, title, body, data)
            );
            
            await Promise.all(promises);
            return true;
        } catch (error) {
            console.error('Error sending notifications to users:', error);
            return false;
        }
    }

    // Send notification to all users
    async sendNotificationToAll(title, body, data = {}) {
        try {
            const tokensSnapshot = await db.collection('userTokens').get();
            const usernames = [];
            
            tokensSnapshot.forEach(doc => {
                usernames.push(doc.id);
            });

            console.log(`Sending notification to all users (${usernames.length}): ${title}`);
            
            // Send to all users
            await this.sendNotificationToUsers(usernames, title, body, data);
            
            // Also store as broadcast notification
            await db.collection('broadcastNotifications').add({
                title: title,
                body: body,
                data: data,
                sentBy: currentUser?.username || 'system',
                sentAt: new Date().toISOString(),
                userCount: usernames.length
            });

            return true;
        } catch (error) {
            console.error('Error sending notification to all:', error);
            return false;
        }
    }

    // Load user notification settings
    loadNotificationSettings() {
        const saved = localStorage.getItem('notificationSettings');
        if (saved) {
            try {
                this.notificationSettings = JSON.parse(saved);
            } catch (e) {
                console.error('Error loading notification settings:', e);
            }
        }
    }

    // Save user notification settings
    saveNotificationSettings() {
        localStorage.setItem('notificationSettings', JSON.stringify(this.notificationSettings));
        
        // Also save to Firestore if user is logged in
        if (currentUser && this.fcmToken) {
            this.saveTokenToProfile(this.fcmToken);
        }
    }

    // Test notification
    async testNotification() {
        if (!this.isInitialized) {
            showToast('Push notifications not initialized', 'warning');
            return;
        }

        const title = 'Test Notification';
        const body = 'This is a test notification from Duty Manager';
        
        // Send to current user
        await this.sendNotificationToUser(
            currentUser.username,
            title,
            body,
            { type: 'test', testTime: new Date().toISOString() }
        );
        
        showToast('Test notification sent!', 'success');
    }

    // Get notification statistics
    async getNotificationStats() {
        try {
            const tokensSnapshot = await db.collection('userTokens').get();
            const totalUsers = tokensSnapshot.size;
            
            const notificationsSnapshot = await db.collection('notifications')
                .where('createdAt', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
                .get();
            
            const weeklyNotifications = notificationsSnapshot.size;
            
            return {
                totalUsers: totalUsers,
                weeklyNotifications: weeklyNotifications,
                pushEnabled: this.isInitialized,
                permissionGranted: this.isPermissionGranted
            };
        } catch (error) {
            console.error('Error getting notification stats:', error);
            return null;
        }
    }

    // Cleanup old tokens
    async cleanupOldTokens(days = 30) {
        try {
            const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
            const tokensSnapshot = await db.collection('userTokens')
                .where('lastUpdated', '<', cutoffDate.toISOString())
                .get();
            
            const batch = db.batch();
            tokensSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            console.log(`Cleaned up ${tokensSnapshot.size} old tokens`);
            return tokensSnapshot.size;
        } catch (error) {
            console.error('Error cleaning up old tokens:', error);
            return 0;
        }
    }
}

// Create global instance
const pushManager = new PushNotificationManager();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
            console.log('Message from Service Worker:', event.data);
            
            switch(event.data.type) {
                case 'NOTIFICATION_CLICK':
                    console.log('Notification clicked in Service Worker:', event.data.data);
                    // Handle notification click
                    if (event.data.data?.requestId) {
                        showSection('myRequests');
                    } else if (event.data.data?.type === 'announcement') {
                        showSection('home');
                    }
                    break;
                    
                case 'GET_FIREBASE_CONFIG':
                    // Service Worker is asking for config
                    pushManager.loadFirebaseConfig().then(() => {
                        if (pushManager.config && pushManager.serviceWorkerRegistration?.active) {
                            pushManager.serviceWorkerRegistration.active.postMessage({
                                type: 'UPDATE_FIREBASE_CONFIG',
                                config: pushManager.config
                            });
                        }
                    });
                    break;
            }
        });
    }
});
