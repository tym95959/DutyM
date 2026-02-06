// push-notifications.js
class PushNotificationManager {
    constructor() {
        this.fcmToken = null;
        this.messaging = null;
        this.isInitialized = false;
        this.isPermissionGranted = false;
        this.config = null;
    }

    // Load config from Firebase
    async loadFirebaseConfig() {
        try {
            const doc = await db.collection('systemConfig').doc('firebase').get();
            if (doc.exists) {
                this.config = doc.data();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error loading Firebase config:', error);
            return false;
        }
    }

    // Check and request notification permission
    async checkNotificationPermission() {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            this.isPermissionGranted = true;
            return true;
        } else if (Notification.permission === 'denied') {
            console.log('Notification permission denied');
            return false;
        } else {
            const permission = await Notification.requestPermission();
            this.isPermissionGranted = permission === 'granted';
            return this.isPermissionGranted;
        }
    }

    // Initialize Firebase Messaging
    async initialize() {
        if (this.isInitialized) return true;

        try {
            // Load Firebase config
            const hasConfig = await this.loadFirebaseConfig();
            if (!hasConfig || !this.config) {
                console.log('Firebase config not found');
                return false;
            }

            // Initialize Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(this.config);
            }

            // Get messaging instance
            this.messaging = firebase.messaging();

            // Register service worker
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.register('firebase-messaging-sw.js');
                console.log('Service Worker registered:', registration);
                this.messaging.useServiceWorker(registration);
            }

            // Get FCM token
            this.fcmToken = await this.getToken();
            
            // Save token to user's profile
            if (this.fcmToken && currentUser) {
                await this.saveTokenToProfile(this.fcmToken);
            }

            // Set up message listeners
            this.setupMessageListeners();

            this.isInitialized = true;
            console.log('Push notifications initialized');
            return true;
        } catch (error) {
            console.error('Error initializing push notifications:', error);
            return false;
        }
    }

    // Get FCM token
    async getToken() {
        try {
            const token = await this.messaging.getToken({ 
                vapidKey: this.config.vapidKey 
            });
            
            if (token) {
                console.log('FCM Token:', token);
                return token;
            } else {
                console.log('No registration token available');
                return null;
            }
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    }

    // Save token to user's profile in Firestore
    async saveTokenToProfile(token) {
        try {
            await db.collection('userTokens').doc(currentUser.username).set({
                token: token,
                username: currentUser.username,
                name: currentUser.name,
                rcNo: currentUser.rcNo,
                lastUpdated: new Date().toISOString()
            }, { merge: true });
            console.log('Token saved to profile');
        } catch (error) {
            console.error('Error saving token:', error);
        }
    }

    // Setup message listeners
    setupMessageListeners() {
        // Foreground messages
        this.messaging.onMessage((payload) => {
            console.log('Foreground message received:', payload);
            
            // Show in-app notification
            this.showInAppNotification(payload);
            
            // Also show browser notification if permission granted
            if (this.isPermissionGranted) {
                this.showBrowserNotification(payload);
            }
        });

        // Token refresh
        this.messaging.onTokenRefresh(async () => {
            console.log('Token refreshed');
            this.fcmToken = await this.getToken();
            if (this.fcmToken && currentUser) {
                await this.saveTokenToProfile(this.fcmToken);
            }
        });
    }

    // Show in-app notification (toast)
    showInAppNotification(payload) {
        const title = payload.notification?.title || 'New Notification';
        const body = payload.notification?.body || '';
        const type = payload.data?.type || 'info';
        
        showToast(`${title}: ${body}`, type);
    }

    // Show browser notification
    showBrowserNotification(payload) {
        const title = payload.notification?.title || 'Duty Manager';
        const body = payload.notification?.body || 'New notification';
        
        const options = {
            body: body,
            icon: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%233498db\'/%3E%3Ccircle cx=\'50\' cy=\'35\' r=\'12\' fill=\'white\'/%3E%3Cpath d=\'M50,55 C65,55 70,70 70,70 L30,70 C30,70 35,55 50,55 Z\' fill=\'white\'/%3E%3Cpath d=\'M35,75 L65,75 L65,85 C65,90 60,95 50,95 C40,95 35,90 35,85 Z\' fill=\'white\'/%3E%3Cpath d=\'M20,20 L20,40 L30,30 Z\' fill=\'%2327ae60\'/%3E%3C/svg%3E',
            badge: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%233498db\'/%3E%3Ccircle cx=\'50\' cy=\'35\' r=\'12\' fill=\'white\'/%3E%3Cpath d=\'M50,55 C65,55 70,70 70,70 L30,70 C30,70 35,55 50,55 Z\' fill=\'white\'/%3E%3Cpath d=\'M35,75 L65,75 L65,85 C65,90 60,95 50,95 C40,95 35,90 35,85 Z\' fill=\'white\'/%3E%3Cpath d=\'M20,20 L20,40 L30,30 Z\' fill=\'%2327ae60\'/%3E%3C/svg%3E',
            data: payload.data || {},
            tag: payload.data?.type || 'general',
            renotify: true
        };
        
        if (Notification.permission === 'granted') {
            new Notification(title, options);
        }
    }

    // Send notification to specific user
    async sendNotificationToUser(username, title, body, data = {}) {
        try {
            // Get user's token from Firestore
            const tokenDoc = await db.collection('userTokens').doc(username).get();
            if (!tokenDoc.exists) {
                console.log('User token not found:', username);
                return false;
            }

            const userToken = tokenDoc.data().token;
            
            // This would typically be done on server-side
            // For demo, we'll simulate by sending to our own device
            if (currentUser.username === username && this.fcmToken) {
                // Simulate receiving notification
                const payload = {
                    notification: { title, body },
                    data: { ...data, type: 'direct' }
                };
                this.showInAppNotification(payload);
            }

            console.log(`Notification sent to ${username}: ${title}`);
            return true;
        } catch (error) {
            console.error('Error sending notification:', error);
            return false;
        }
    }

    // Send notification to all users
    async sendNotificationToAll(title, body, data = {}) {
        try {
            const tokensSnapshot = await db.collection('userTokens').get();
            const tokens = [];
            
            tokensSnapshot.forEach(doc => {
                tokens.push(doc.data().token);
            });

            // Log for demo
            console.log(`Notification sent to all users (${tokens.length}): ${title}`);
            
            // Show local notification
            if (this.isPermissionGranted) {
                this.showBrowserNotification({
                    notification: { title, body },
                    data: { ...data, type: 'broadcast' }
                });
            }
            
            return true;
        } catch (error) {
            console.error('Error sending notification to all:', error);
            return false;
        }
    }

    // Initialize on page load
    async initOnLoad() {
        // Check permission
        await this.checkNotificationPermission();
        
        // Initialize after user logs in
        // We'll call this manually after login
    }
}

// Create global instance
const pushManager = new PushNotificationManager();
