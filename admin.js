class NotificationAdmin {
    constructor() {
        this.tokens = [];
        this.notificationHistory = [];
        this.config = {
            apiKey: localStorage.getItem('fcm_admin_api_key') || '',
            serverUrl: localStorage.getItem('fcm_server_url') || 'https://your-api.vercel.app/api/send'
        };
        
        this.init();
    }
    
    init() {
        this.loadTokens();
        this.loadHistory();
        this.setupEventListeners();
        this.updateStats();
    }
    
    setupEventListeners() {
        // Send notification form
        document.getElementById('notificationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendNotification();
        });
        
        // Test button
        document.getElementById('testBtn').addEventListener('click', () => {
            this.sendTestNotification();
        });
        
        // Recipient selection
        document.getElementById('recipient').addEventListener('change', (e) => {
            this.toggleRecipientInputs(e.target.value);
        });
        
        // Save config
        document.getElementById('saveConfigBtn').addEventListener('click', () => {
            this.saveConfig();
        });
        
        // Load tokens
        document.getElementById('loadTokensBtn').addEventListener('click', () => {
            this.loadTokens();
        });
        
        // Initialize config inputs
        document.getElementById('apiKey').value = this.config.apiKey;
        document.getElementById('serverUrl').value = this.config.serverUrl;
        
        // Load initial data
        this.loadTokens();
    }
    
    toggleRecipientInputs(recipient) {
        const tokenGroup = document.getElementById('tokenInputGroup');
        const topicGroup = document.getElementById('topicInputGroup');
        
        if (recipient === 'specific') {
            tokenGroup.style.display = 'block';
            topicGroup.style.display = 'none';
        } else if (recipient === 'topic') {
            tokenGroup.style.display = 'none';
            topicGroup.style.display = 'block';
        } else {
            tokenGroup.style.display = 'none';
            topicGroup.style.display = 'none';
        }
    }
    
    async sendNotification() {
        const title = document.getElementById('title').value;
        const body = document.getElementById('body').value;
        const icon = document.getElementById('icon').value;
        const image = document.getElementById('image').value;
        const url = document.getElementById('url').value;
        const recipient = document.getElementById('recipient').value;
        const token = document.getElementById('token').value;
        const topic = document.getElementById('topic').value;
        
        if (!this.config.apiKey) {
            this.showError('Please configure your Firebase Admin SDK key first');
            return;
        }
        
        const notification = {
            title,
            body,
            data: {
                url: url || window.location.origin,
                timestamp: new Date().toISOString(),
                type: 'admin_notification'
            }
        };
        
        if (icon) notification.icon = icon;
        if (image) notification.image = image;
        
        let payload = {
            notification,
            webpush: {
                notification: {
                    ...notification,
                    actions: [
                        {
                            action: 'open',
                            title: 'Open'
                        }
                    ]
                }
            }
        };
        
        try {
            this.showLoading();
            
            if (recipient === 'specific' && token) {
                payload.token = token;
            } else if (recipient === 'topic' && topic) {
                payload.topic = topic;
            } else {
                payload.tokens = this.tokens;
            }
            
            const response = await fetch(this.config.serverUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showSuccess(`Notification sent successfully! ${result.successCount || 1} delivered`);
                this.addToHistory(notification);
                this.updateStats();
                this.clearForm();
            } else {
                throw new Error(result.error || 'Failed to send notification');
            }
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }
    
    async sendTestNotification() {
        // Fill form with test data
        document.getElementById('title').value = 'Test Notification 🔔';
        document.getElementById('body').value = 'This is a test notification sent from the admin panel.';
        document.getElementById('icon').value = 'https://cdn-icons-png.flaticon.com/512/733/733585.png';
        document.getElementById('url').value = window.location.origin;
        
        // Send notification
        await this.sendNotification();
    }
    
    saveConfig() {
        const apiKey = document.getElementById('apiKey').value;
        const serverUrl = document.getElementById('serverUrl').value;
        
        this.config.apiKey = apiKey;
        this.config.serverUrl = serverUrl;
        
        localStorage.setItem('fcm_admin_api_key', apiKey);
        localStorage.setItem('fcm_server_url', serverUrl);
        
        this.showSuccess('Configuration saved successfully!');
    }
    
    async loadTokens() {
        try {
            const response = await fetch('/api/tokens', {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.tokens = data.tokens || [];
                this.displayTokens();
                this.updateStats();
            }
        } catch (error) {
            console.error('Error loading tokens:', error);
        }
    }
    
    displayTokens() {
        const container = document.getElementById('tokensContainer');
        container.innerHTML = '';
        
        if (this.tokens.length === 0) {
            container.innerHTML = '<p style="color: #8b949e; text-align: center;">No tokens found</p>';
            return;
        }
        
        this.tokens.slice(0, 10).forEach((token, index) => {
            const element = document.createElement('div');
            element.className = 'token-item';
            element.innerHTML = `
                <div class="token-preview">${token.substring(0, 50)}...</div>
                <div class="token-actions">
                    <button class="action-btn" onclick="admin.copyToken('${token}')">📋</button>
                    <button class="action-btn" onclick="admin.sendToToken('${token}')">🚀</button>
                    <button class="action-btn" onclick="admin.removeToken('${token}')">🗑️</button>
                </div>
            `;
            container.appendChild(element);
        });
        
        if (this.tokens.length > 10) {
            const moreElement = document.createElement('div');
            moreElement.style.textAlign = 'center';
            moreElement.style.marginTop = '10px';
            moreElement.innerHTML = `<span style="color: #8b949e;">+ ${this.tokens.length - 10} more tokens</span>`;
            container.appendChild(moreElement);
        }
    }
    
    loadHistory() {
        const history = JSON.parse(localStorage.getItem('notification_history') || '[]');
        this.notificationHistory = history;
        this.displayHistory();
    }
    
    displayHistory() {
        const container = document.getElementById('historyContainer');
        container.innerHTML = '';
        
        if (this.notificationHistory.length === 0) {
            container.innerHTML = '<p style="color: #8b949e; text-align: center;">No notification history</p>';
            return;
        }
        
        this.notificationHistory.slice(0, 5).forEach(item => {
            const element = document.createElement('div');
            element.className = 'history-item';
            element.innerHTML = `
                <div class="history-title">${item.title}</div>
                <div class="history-body">${item.body}</div>
                <div class="history-meta">
                    <span>${new Date(item.timestamp).toLocaleString()}</span>
                    <span>${item.success ? '✅ Sent' : '❌ Failed'}</span>
                </div>
            `;
            container.appendChild(element);
        });
    }
    
    addToHistory(notification) {
        const historyItem = {
            ...notification,
            timestamp: new Date().toISOString(),
            success: true
        };
        
        this.notificationHistory.unshift(historyItem);
        this.notificationHistory = this.notificationHistory.slice(0, 50); // Keep only last 50 items
        
        localStorage.setItem('notification_history', JSON.stringify(this.notificationHistory));
        this.displayHistory();
    }
    
    updateStats() {
        document.getElementById('totalTokens').textContent = this.tokens.length;
        document.getElementById('totalSent').textContent = this.notificationHistory.length;
        
        const sentToday = this.notificationHistory.filter(item => {
            const today = new Date().toDateString();
            return new Date(item.timestamp).toDateString() === today;
        }).length;
        
        document.getElementById('sentToday').textContent = sentToday;
        
        const successCount = this.notificationHistory.filter(item => item.success).length;
        const successRate = this.notificationHistory.length > 0 
            ? Math.round((successCount / this.notificationHistory.length) * 100)
            : 0;
        
        document.getElementById('successRate').textContent = `${successRate}%`;
    }
    
    clearForm() {
        document.getElementById('title').value = '';
        document.getElementById('body').value = '';
        document.getElementById('icon').value = '';
        document.getElementById('image').value = '';
        document.getElementById('url').value = '';
        document.getElementById('token').value = '';
        document.getElementById('topic').value = '';
    }
    
    copyToken(token) {
        navigator.clipboard.writeText(token)
            .then(() => {
                this.showSuccess('Token copied to clipboard!');
            })
            .catch(err => {
                this.showError('Failed to copy token');
            });
    }
    
    async sendToToken(token) {
        document.getElementById('recipient').value = 'specific';
        this.toggleRecipientInputs('specific');
        document.getElementById('token').value = token;
        document.getElementById('title').focus();
    }
    
    async removeToken(token) {
        if (confirm('Are you sure you want to remove this token?')) {
            try {
                const response = await fetch(`/api/tokens/${token}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.config.apiKey}`
                    }
                });
                
                if (response.ok) {
                    this.tokens = this.tokens.filter(t => t !== token);
                    this.displayTokens();
                    this.updateStats();
                    this.showSuccess('Token removed successfully');
                }
            } catch (error) {
                this.showError('Failed to remove token');
            }
        }
    }
    
    showSuccess(message) {
        const element = document.getElementById('successMessage');
        element.textContent = message;
        element.style.display = 'block';
        
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
    
    showError(message) {
        const element = document.getElementById('errorMessage');
        element.textContent = message;
        element.style.display = 'block';
        
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
    
    showLoading() {
        const sendBtn = document.querySelector('#notificationForm button[type="submit"]');
        sendBtn.innerHTML = '<span>⏳ Sending...</span>';
        sendBtn.disabled = true;
    }
    
    hideLoading() {
        const sendBtn = document.querySelector('#notificationForm button[type="submit"]');
        sendBtn.innerHTML = '<span>🚀 Send Notification</span>';
        sendBtn.disabled = false;
    }
}

// Initialize admin
const admin = new NotificationAdmin();
window.admin = admin;
