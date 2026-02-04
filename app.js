// app.js - Main Application Logic
class LeaveManagementApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = null;
        this.settings = {};
        this.init();
    }

    async init() {
        // Wait for auth manager to initialize
        await this.waitForAuth();
        
        // Get current user
        this.currentUser = authManager.getCurrentUser();
        
        // Get current page
        this.currentPage = window.location.pathname.split('/').pop();
        
        // Initialize based on page
        this.initPage();
        
        // Load settings
        await this.loadSettings();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup real-time listeners
        this.setupRealtimeListeners();
        
        // Check for notifications
        this.checkNotifications();
        
        console.log('App initialized for:', this.currentUser.name);
    }

    waitForAuth() {
        return new Promise((resolve) => {
            const checkAuth = () => {
                if (authManager.isInitialized) {
                    resolve();
                } else {
                    setTimeout(checkAuth, 100);
                }
            };
            checkAuth();
        });
    }

    initPage() {
        const pageMap = {
            'index.html': 'initStaffDashboard',
            'admin.html': 'initAdminDashboard',
            'general.html': 'initGeneralDashboard',
            'login.html': 'initLoginPage'
        };

        const pageHandler = pageMap[this.currentPage];
        if (pageHandler && typeof this[pageHandler] === 'function') {
            this[pageHandler]();
        }
    }

    async loadSettings() {
        try {
            const result = await dbHelper.getById(Collections.SETTINGS, 'system');
            if (result.success) {
                this.settings = result.data;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    setupEventListeners() {
        // Global logout
        const logoutButtons = document.querySelectorAll('[data-action="logout"]');
        logoutButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        });

        // Notification bell
        const notificationBell = document.querySelector('.notification-bell');
        if (notificationBell) {
            notificationBell.addEventListener('click', () => this.toggleNotifications());
        }

        // Close modals on ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Click outside to close dropdowns
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.notification-dropdown')) {
                this.closeNotifications();
            }
        });
    }

    setupRealtimeListeners() {
        // Listen for announcements
        if (this.currentUser) {
            this.unsubscribeAnnouncements = dbHelper.onSnapshot(
                Collections.ANNOUNCEMENTS,
                (announcements) => {
                    this.updateAnnouncements(announcements);
                },
                [
                    { field: 'audience', operator: 'in', value: ['all', this.currentUser.rcNumber] },
                    { field: 'expiryDate', operator: '>=', value: new Date().toISOString().split('T')[0] }
                ],
                { field: 'createdAt', direction: 'desc' }
            );

            // Listen for notifications
            this.unsubscribeNotifications = dbHelper.onSnapshot(
                Collections.NOTIFICATIONS,
                (notifications) => {
                    this.updateNotificationBadge(notifications);
                },
                [
                    { field: 'userId', operator: '==', value: this.currentUser.rcNumber },
                    { field: 'read', operator: '==', value: false }
                ]
            );
        }
    }

    async initStaffDashboard() {
        if (!authManager.isStaff() && !authManager.isAdmin()) {
            window.location.href = 'login.html';
            return;
        }

        // Load dashboard data
        await this.loadDashboardData();

        // Setup tab switching
        this.setupTabs();

        // Setup form submissions
        this.setupStaffForms();

        // Update UI with user info
        this.updateUserInfo();

        // Start auto-refresh
        this.startAutoRefresh();
    }

    async loadDashboardData() {
        try {
            // Load multiple data sources in parallel
            const [roster, leaves, requests, announcements] = await Promise.all([
                this.getUpcomingRoster(),
                this.getRecentLeaves(),
                this.getPendingRequests(),
                this.getAnnouncements()
            ]);

            // Update UI
            this.updateDashboardStats(roster, leaves, requests);
            this.updateRosterTable(roster);
            this.updateLeaveHistory(leaves);
            this.updatePendingRequests(requests);
            this.updateAnnouncementsList(announcements);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    async getUpcomingRoster(days = 7) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);

        const result = await dbHelper.query(
            Collections.ROSTERS,
            [
                { field: 'rcNumber', operator: '==', value: this.currentUser.rcNumber },
                { field: 'date', operator: '>=', value: startDate.toISOString().split('T')[0] },
                { field: 'date', operator: '<=', value: endDate.toISOString().split('T')[0] }
            ],
            { field: 'date', direction: 'asc' }
        );

        return result.success ? result.data : [];
    }

    async getRecentLeaves(limit = 10) {
        const result = await dbHelper.query(
            Collections.SICK_LEAVES,
            [
                { field: 'rcNumber', operator: '==', value: this.currentUser.rcNumber }
            ],
            { field: 'date', direction: 'desc' },
            limit
        );

        return result.success ? result.data : [];
    }

    async getPendingRequests() {
        const result = await dbHelper.query(
            Collections.DUTY_CHANGES,
            [
                { field: 'status', operator: '==', value: 'pending' },
                { field: '$or', operator: '==', value: [
                    { requesterRc: this.currentUser.rcNumber },
                    { requestedRc: this.currentUser.rcNumber }
                ]}
            ],
            { field: 'createdAt', direction: 'desc' }
        );

        return result.success ? result.data : [];
    }

    async getAnnouncements() {
        const result = await dbHelper.query(
            Collections.ANNOUNCEMENTS,
            [
                { field: 'audience', operator: 'in', value: ['all', this.currentUser.rcNumber] },
                { field: 'expiryDate', operator: '>=', value: new Date().toISOString().split('T')[0] }
            ],
            { field: 'createdAt', direction: 'desc' },
            5
        );

        return result.success ? result.data : [];
    }

    updateDashboardStats(roster, leaves, requests) {
        // Update leave balances
        document.getElementById('slBalance').textContent = this.currentUser.slBalance;
        document.getElementById('frlBalance').textContent = this.currentUser.frlBalance;
        document.getElementById('upcomingDuty').textContent = roster.length;
        document.getElementById('pendingRequests').textContent = requests.length;
    }

    updateRosterTable(roster) {
        const tbody = document.querySelector('#rosterTable tbody');
        if (!tbody) return;

        if (roster.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">
                        No upcoming roster found
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = roster.map(item => `
            <tr>
                <td>${this.formatDate(item.date)}</td>
                <td>${this.getDayName(item.date)}</td>
                <td><span class="badge badge-primary">${item.dutyTime}</span></td>
                <td>${item.remarks || '-'}</td>
            </tr>
        `).join('');
    }

    updateLeaveHistory(leaves) {
        const tbody = document.querySelector('#leaveHistoryTable tbody');
        if (!tbody) return;

        if (leaves.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">
                        No leave history found
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = leaves.map(leave => `
            <tr>
                <td>${this.formatDate(leave.date)}</td>
                <td><span class="badge ${leave.type === 'SL' ? 'badge-warning' : 'badge-success'}">${leave.type}</span></td>
                <td>${leave.dutyTime}</td>
                <td>${leave.reason}</td>
                <td><span class="badge badge-${leave.status === 'approved' ? 'success' : 'warning'}">${leave.status}</span></td>
            </tr>
        `).join('');
    }

    updatePendingRequests(requests) {
        const container = document.getElementById('pendingRequestsContainer');
        if (!container) return;

        if (requests.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-exchange-alt"></i>
                    </div>
                    <h4 class="empty-state-title">No Pending Requests</h4>
                    <p class="empty-state-description">You have no pending duty change requests</p>
                </div>
            `;
            return;
        }

        container.innerHTML = requests.map(request => {
            const isRequester = request.requesterRc === this.currentUser.rcNumber;
            const otherUser = isRequester ? request.requestedRc : request.requesterRc;
            
            return `
                <div class="request-item ${isRequester ? 'sent' : 'received'}">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <strong>${isRequester ? 'To' : 'From'}:</strong> RC ${otherUser}
                        </div>
                        <span class="badge badge-warning">Pending</span>
                    </div>
                    <div class="mb-2">
                        <strong>Date:</strong> ${this.formatDate(request.changeDate)}
                    </div>
                    <div class="mb-3">
                        <strong>Swap:</strong> ${request.requesterDutyTime} ↔ ${request.requestedDutyTime}
                    </div>
                    ${!isRequester ? `
                        <div class="d-flex gap-2">
                            <button class="btn btn-success btn-sm" onclick="app.respondToRequest('${request.id}', true)">
                                <i class="fas fa-check"></i> Accept
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="app.respondToRequest('${request.id}', false)">
                                <i class="fas fa-times"></i> Reject
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    updateAnnouncementsList(announcements) {
        const container = document.getElementById('announcementsContainer');
        if (!container) return;

        if (announcements.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-bullhorn"></i>
                    </div>
                    <h4 class="empty-state-title">No Announcements</h4>
                    <p class="empty-state-description">No announcements at the moment</p>
                </div>
            `;
            return;
        }

        container.innerHTML = announcements.map(announcement => `
            <div class="announcement-item">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="mb-0">${announcement.title}</h5>
                    <small class="text-muted">${this.formatDate(announcement.createdAt?.toDate())}</small>
                </div>
                <p class="mb-2">${announcement.content}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <small class="badge badge-light">
                        <i class="fas fa-users"></i> ${announcement.audience === 'all' ? 'All Users' : 'Specific'}
                    </small>
                    <small class="text-muted">
                        Expires: ${this.formatDate(announcement.expiryDate)}
                    </small>
                </div>
            </div>
        `).join('');
    }

    setupTabs() {
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show corresponding content
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${tabId}Tab`) {
                        content.classList.add('active');
                        
                        // Load content if needed
                        this.loadTabContent(tabId);
                    }
                });
            });
        });
    }

    async loadTabContent(tabId) {
        switch (tabId) {
            case 'roster':
                await this.loadFullRoster();
                break;
            case 'leaves':
                await this.loadAllLeaves();
                break;
            case 'announcements':
                await this.loadAllAnnouncements();
                break;
        }
    }

    setupStaffForms() {
        // Sick Leave Form
        const slForm = document.getElementById('sickLeaveForm');
        if (slForm) {
            slForm.addEventListener('submit', (e) => this.handleSickLeave(e));
        }

        // FRL Form
        const frlForm = document.getElementById('frLeaveForm');
        if (frlForm) {
            frlForm.addEventListener('submit', (e) => this.handleFRL(e));
        }

        // Duty Change Form
        const dutyChangeForm = document.getElementById('dutyChangeForm');
        if (dutyChangeForm) {
            dutyChangeForm.addEventListener('submit', (e) => this.handleDutyChange(e));
        }

        // Date change listeners
        const slDate = document.getElementById('slDate');
        if (slDate) {
            slDate.addEventListener('change', () => this.updateDutyTime('sl'));
        }

        const frlDate = document.getElementById('frlDate');
        if (frlDate) {
            frlDate.addEventListener('change', () => this.updateDutyTime('frl'));
        }

        const changeDate = document.getElementById('changeDate');
        if (changeDate) {
            changeDate.addEventListener('change', () => {
                this.updateDutyTime('change');
                this.loadStaffForDate();
            });
        }
    }

    async updateDutyTime(formType) {
        const dateInput = document.getElementById(`${formType}Date`);
        const dutyTimeInput = document.getElementById(`${formType}DutyTime`);
        
        if (!dateInput || !dutyTimeInput || !dateInput.value) return;

        try {
            const dutyTime = await this.getDutyTime(dateInput.value);
            dutyTimeInput.value = dutyTime;
        } catch (error) {
            dutyTimeInput.value = '';
            this.showError('No duty found for selected date');
        }
    }

    async getDutyTime(date) {
        const result = await dbHelper.query(
            Collections.ROSTERS,
            [
                { field: 'rcNumber', operator: '==', value: this.currentUser.rcNumber },
                { field: 'date', operator: '==', value: date }
            ]
        );

        if (result.success && result.data.length > 0) {
            return result.data[0].dutyTime;
        }
        throw new Error('No duty found');
    }

    async handleSickLeave(e) {
        e.preventDefault();
        
        const date = document.getElementById('slDate').value;
        const reason = document.getElementById('slReason').value.trim();
        
        // Validation
        if (!date || !reason) {
            this.showError('Please fill all required fields');
            return;
        }

        // Check minimum 2 hours before duty
        const isValid = await this.validateLeaveTime(date, 'SL');
        if (!isValid.valid) {
            this.showError(isValid.error);
            return;
        }

        // Submit leave
        await this.submitLeave(date, reason, 'SL');
    }

    async handleFRL(e) {
        e.preventDefault();
        
        const date = document.getElementById('frlDate').value;
        const reason = document.getElementById('frlReason').value.trim();
        
        // Validation
        if (!date || !reason) {
            this.showError('Please fill all required fields');
            return;
        }

        // Check minimum 1 hour before duty
        const isValid = await this.validateLeaveTime(date, 'FRL');
        if (!isValid.valid) {
            this.showError(isValid.error);
            return;
        }

        // Submit leave
        await this.submitLeave(date, reason, 'FRL');
    }

    async validateLeaveTime(date, type) {
        const now = new Date();
        const selectedDate = new Date(date);
        
        // Check backdate
        if (selectedDate < new Date(now.toDateString())) {
            return { valid: false, error: 'Backdates are not allowed' };
        }

        // Get duty time
        let dutyTime;
        try {
            dutyTime = await this.getDutyTime(date);
        } catch (error) {
            return { valid: false, error: 'No duty found for selected date' };
        }

        // Calculate time difference
        const dutyDateTime = new Date(`${date}T${dutyTime}`);
        const timeDiff = dutyDateTime - now;
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        // Check minimum hours
        const minHours = type === 'SL' ? 2 : 1;
        if (hoursDiff < minHours) {
            return { 
                valid: false, 
                error: `${type} must be submitted minimum ${minHours} hour${minHours > 1 ? 's' : ''} before duty time` 
            };
        }

        return { valid: true };
    }

    async submitLeave(date, reason, type) {
        try {
            const dutyTime = await this.getDutyTime(date);
            
            const leaveData = {
                rcNumber: this.currentUser.rcNumber,
                name: this.currentUser.name,
                date: date,
                dutyTime: dutyTime,
                reason: reason,
                type: type,
                status: 'pending',
                appliedAt: new Date().toISOString(),
                userId: this.currentUser.id
            };

            const collection = type === 'SL' ? Collections.SICK_LEAVES : Collections.FR_LEAVES;
            const result = await dbHelper.add(collection, leaveData);

            if (result.success) {
                this.showSuccess(`${type} applied successfully`);
                document.getElementById(`${type.toLowerCase()}Form`).reset();
                
                // Update user balance
                authManager.updateUserBalance(this.currentUser.rcNumber, type, 1);
                
                // Refresh data
                await this.loadDashboardData();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            this.showError(`Failed to apply ${type}: ${error.message}`);
        }
    }

    async handleDutyChange(e) {
        e.preventDefault();
        
        const changeDate = document.getElementById('changeDate').value;
        const requestedStaff = document.getElementById('requestedStaff').value;
        const requesterDutyTime = document.getElementById('requesterDutyTime').value;
        const requestedDutyTime = document.getElementById('requestedDutyTime').value;
        
        // Validation
        if (!changeDate || !requestedStaff || !requesterDutyTime || !requestedDutyTime) {
            this.showError('Please fill all required fields');
            return;
        }

        // Check if date is in future
        const selectedDate = new Date(changeDate);
        if (selectedDate < new Date(new Date().toDateString())) {
            this.showError('Cannot request duty change for past dates');
            return;
        }

        // Get requested staff details
        const staff = authManager.getUserByRC(requestedStaff);
        if (!staff) {
            this.showError('Selected staff not found');
            return;
        }

        // Submit duty change request
        await this.submitDutyChange(changeDate, staff, requesterDutyTime, requestedDutyTime);
    }

    async submitDutyChange(date, requestedStaff, requesterTime, requestedTime) {
        try {
            const requestData = {
                requesterRc: this.currentUser.rcNumber,
                requesterName: this.currentUser.name,
                requestedRc: requestedStaff.RCNo,
                requestedName: requestedStaff.name,
                changeDate: date,
                requesterDutyTime: requesterTime,
                requestedDutyTime: requestedTime,
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            const result = await dbHelper.add(Collections.DUTY_CHANGES, requestData);

            if (result.success) {
                this.showSuccess('Duty change request sent');
                document.getElementById('dutyChangeForm').reset();
                
                // Send notification
                await this.sendNotification(
                    requestedStaff.RCNo,
                    'New Duty Change Request',
                    `${this.currentUser.name} has requested a duty change on ${this.formatDate(date)}`
                );
                
                // Refresh data
                await this.loadDashboardData();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            this.showError(`Failed to send request: ${error.message}`);
        }
    }

    async respondToRequest(requestId, accept) {
        try {
            const result = await dbHelper.getById(Collections.DUTY_CHANGES, requestId);
            if (!result.success) {
                throw new Error('Request not found');
            }

            const request = result.data;
            const updateData = {
                status: accept ? 'accepted' : 'rejected',
                respondedAt: new Date().toISOString(),
                respondedBy: this.currentUser.rcNumber
            };

            // Update request status
            await dbHelper.update(Collections.DUTY_CHANGES, requestId, updateData);

            if (accept) {
                // Update rosters
                await this.updateRosters(request);
                
                // Send acceptance notification
                await this.sendNotification(
                    request.requesterRc,
                    'Duty Change Accepted',
                    `${this.currentUser.name} has accepted your duty change request for ${this.formatDate(request.changeDate)}`
                );
            } else {
                // Send rejection notification
                await this.sendNotification(
                    request.requesterRc,
                    'Duty Change Rejected',
                    `${this.currentUser.name} has rejected your duty change request for ${this.formatDate(request.changeDate)}`
                );
            }

            this.showSuccess(`Request ${accept ? 'accepted' : 'rejected'} successfully`);
            await this.loadDashboardData();
        } catch (error) {
            this.showError(`Failed to respond: ${error.message}`);
        }
    }

    async updateRosters(request) {
        // Update requester's roster
        await dbHelper.update(
            Collections.ROSTERS,
            request.requesterRosterId,
            { dutyTime: request.requestedDutyTime }
        );

        // Update requested staff's roster
        await dbHelper.update(
            Collections.ROSTERS,
            request.requestedRosterId,
            { dutyTime: request.requesterDutyTime }
        );
    }

    async loadStaffForDate() {
        const date = document.getElementById('changeDate').value;
        if (!date) return;

        const select = document.getElementById('requestedStaff');
        if (!select) return;

        // Get all staff except current user
        const staffList = authManager.getStaffUsers().filter(staff => 
            staff.RCNo !== this.currentUser.rcNumber && staff.status === 'active'
        );

        select.innerHTML = '<option value="">Select Staff</option>';
        staffList.forEach(staff => {
            const option = document.createElement('option');
            option.value = staff.RCNo;
            option.textContent = `${staff.RCNo} - ${staff.name}`;
            select.appendChild(option);
        });
    }

    async sendNotification(userId, title, message) {
        const notification = {
            userId: userId,
            title: title,
            message: message,
            type: 'info',
            read: false,
            createdAt: new Date().toISOString()
        };

        await dbHelper.add(Collections.NOTIFICATIONS, notification);
    }

    updateUserInfo() {
        // Update header user info
        const userNameElement = document.getElementById('userName');
        const userRcElement = document.getElementById('userRc');
        const userRoleElement = document.getElementById('userRole');

        if (userNameElement) userNameElement.textContent = this.currentUser.name;
        if (userRcElement) userRcElement.textContent = `RC ${this.currentUser.rcNumber}`;
        if (userRoleElement) userRoleElement.textContent = this.currentUser.level;
    }

    toggleNotifications() {
        const dropdown = document.querySelector('.notification-dropdown');
        dropdown.classList.toggle('active');
        
        if (dropdown.classList.contains('active')) {
            this.loadNotifications();
        }
    }

    closeNotifications() {
        const dropdown = document.querySelector('.notification-dropdown');
        dropdown.classList.remove('active');
    }

    async loadNotifications() {
        const result = await dbHelper.query(
            Collections.NOTIFICATIONS,
            [
                { field: 'userId', operator: '==', value: this.currentUser.rcNumber }
            ],
            { field: 'createdAt', direction: 'desc' },
            10
        );

        if (result.success) {
            this.updateNotificationDropdown(result.data);
        }
    }

    updateNotificationDropdown(notifications) {
        const container = document.querySelector('.notification-list');
        if (!container) return;

        if (notifications.length === 0) {
            container.innerHTML = `
                <div class="empty-state p-3">
                    <div class="empty-state-icon">
                        <i class="fas fa-bell-slash"></i>
                    </div>
                    <h4 class="empty-state-title">No Notifications</h4>
                    <p class="empty-state-description">You have no new notifications</p>
                </div>
            `;
            return;
        }

        container.innerHTML = notifications.map(notification => `
            <div class="notification-item ${notification.read ? '' : 'unread'}" 
                 onclick="app.markNotificationRead('${notification.id}')">
                <div class="d-flex justify-content-between align-items-start">
                    <strong>${notification.title}</strong>
                    <small class="text-muted">${this.formatTime(notification.createdAt)}</small>
                </div>
                <p class="mb-0">${notification.message}</p>
            </div>
        `).join('');
    }

    async markNotificationRead(notificationId) {
        await dbHelper.update(Collections.NOTIFICATIONS, notificationId, { read: true });
        this.loadNotifications();
        this.checkNotifications();
    }

    updateNotificationBadge(notifications) {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            const unreadCount = notifications.filter(n => !n.read).length;
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
    }

    checkNotifications() {
        // This would be called periodically or on user action
        this.loadNotifications();
    }

    startAutoRefresh() {
        // Refresh data every 5 minutes
        setInterval(() => {
            this.loadDashboardData();
        }, 5 * 60 * 1000);
    }

    // Utility methods
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getDayName(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    }

    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    showError(message) {
        this.showAlert(message, 'danger');
    }

    showAlert(message, type) {
        // Create or update alert element
        let alertElement = document.getElementById('globalAlert');
        if (!alertElement) {
            alertElement = document.createElement('div');
            alertElement.id = 'globalAlert';
            alertElement.className = `alert alert-${type} position-fixed`;
            alertElement.style.top = '20px';
            alertElement.style.right = '20px';
            alertElement.style.zIndex = '9999';
            alertElement.style.maxWidth = '400px';
            document.body.appendChild(alertElement);
        }

        alertElement.textContent = message;
        alertElement.className = `alert alert-${type} position-fixed show`;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            alertElement.classList.remove('show');
            setTimeout(() => {
                if (alertElement.parentNode) {
                    alertElement.parentNode.removeChild(alertElement);
                }
            }, 300);
        }, 5000);
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal.active');
        modals.forEach(modal => modal.classList.remove('active'));
    }

    logout() {
        authManager.logout();
        window.location.href = 'login.html';
    }
}

// Initialize app
const app = new LeaveManagementApp();
window.app = app;
