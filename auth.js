// auth.js - Authentication System with Local Users
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        // Load users from users.js
        await this.loadUsers();
        this.isInitialized = true;
        
        // Check for existing session
        this.checkExistingSession();
    }

    async loadUsers() {
        try {
            // Directly use the users array from users.js
            // Since we're including users.js before auth.js, it should be available
            if (typeof users !== 'undefined') {
                this.users = users;
                console.log('Loaded', this.users.length, 'users');
            } else {
                console.error('Users array not found. Make sure users.js is loaded before auth.js');
                this.users = [];
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.users = [];
        }
    }

    checkExistingSession() {
        const storedUser = localStorage.getItem('currentUser');
        const sessionTime = localStorage.getItem('sessionTime');
        
        if (storedUser && sessionTime) {
            const sessionAge = Date.now() - parseInt(sessionTime);
            const maxSessionAge = 12 * 60 * 60 * 1000; // 12 hours
            
            if (sessionAge < maxSessionAge) {
                this.currentUser = JSON.parse(storedUser);
                this.updateActivityTime();
                return true;
            } else {
                // Session expired
                this.clearSession();
            }
        }
        return false;
    }

    async login(username, password) {
        try {
            if (!this.isInitialized) {
                await this.init();
            }

            // Find user by username
            const user = this.users.find(u => 
                u.username.toLowerCase() === username.toLowerCase() && u.status === "active"
            );
            
            if (!user) {
                return { 
                    success: false, 
                    error: 'Invalid username or user is inactive' 
                };
            }

            // Hash the provided password
            const hashedPassword = await this.hashPassword(password);
            
            // Compare hashes
            if (hashedPassword !== user.passwordHash) {
                return { 
                    success: false, 
                    error: 'Invalid password' 
                };
            }

            // Determine user role
            const role = this.determineRole(user.Level);
            
            // Create session user object
            this.currentUser = {
                id: user.RCNo,
                username: user.username,
                name: user.name,
                rcNumber: user.RCNo,
                role: role,
                level: user.Level,
                email: user.email,
                department: user.department,
                phone: user.phone,
                slBalance: user.slBalance,
                frlBalance: user.frlBalance,
                loginTime: new Date().toISOString(),
                sessionId: this.generateSessionId()
            };

            // Save to localStorage
            this.saveSession();
            
            // Update last login time
            this.updateUserLoginTime(user.RCNo);

            return { 
                success: true, 
                user: this.currentUser,
                message: 'Login successful'
            };
        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                error: 'An error occurred during login' 
            };
        }
    }

    determineRole(level) {
        const roleMap = {
            'Supervisor': 'admin',
            'Manager': 'admin',
            'Staff': 'staff',
            'Viewer': 'general'
        };
        return roleMap[level] || 'staff';
    }

    async hashPassword(password) {
        // SHA-256 hashing
        const msgBuffer = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    saveSession() {
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        localStorage.setItem('sessionTime', Date.now().toString());
        localStorage.setItem('sessionId', this.currentUser.sessionId);
    }

    updateActivityTime() {
        localStorage.setItem('sessionTime', Date.now().toString());
    }

    updateUserLoginTime(rcNumber) {
        // Update last login time in users array
        const userIndex = this.users.findIndex(u => u.RCNo === rcNumber);
        if (userIndex !== -1) {
            this.users[userIndex].lastLogin = new Date().toISOString();
        }
    }

    logout() {
        // Log logout time
        if (this.currentUser) {
            const userIndex = this.users.findIndex(u => u.RCNo === this.currentUser.rcNumber);
            if (userIndex !== -1) {
                this.users[userIndex].lastLogout = new Date().toISOString();
            }
        }
        
        this.clearSession();
        this.currentUser = null;
    }

    clearSession() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('sessionTime');
        localStorage.removeItem('sessionId');
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getUserRole() {
        return this.currentUser ? this.currentUser.role : null;
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    isStaff() {
        return this.currentUser && this.currentUser.role === 'staff';
    }

    isGeneral() {
        return this.currentUser && this.currentUser.role === 'general';
    }

    getAllUsers() {
        return this.users;
    }

    getStaffUsers() {
        return this.users.filter(user => 
            user.Level === "Staff" || user.Level === "Supervisor" || user.Level === "Manager"
        );
    }

    getUserByRC(rcNumber) {
        return this.users.find(user => user.RCNo === rcNumber);
    }

    updateUserBalance(rcNumber, leaveType, daysUsed) {
        const user = this.getUserByRC(rcNumber);
        if (user) {
            if (leaveType === 'SL') {
                user.slBalance -= daysUsed;
            } else if (leaveType === 'FRL') {
                user.frlBalance -= daysUsed;
            }
            
            // Update current user if it's the same user
            if (this.currentUser && this.currentUser.rcNumber === rcNumber) {
                this.currentUser.slBalance = user.slBalance;
                this.currentUser.frlBalance = user.frlBalance;
                this.saveSession();
            }
            
            return true;
        }
        return false;
    }

    // Check session timeout (call this periodically)
    checkSessionTimeout() {
        if (!this.isAuthenticated()) return false;
        
        const sessionTime = localStorage.getItem('sessionTime');
        if (!sessionTime) return false;
        
        const sessionAge = Date.now() - parseInt(sessionTime);
        const maxInactiveTime = 30 * 60 * 1000; // 30 minutes
        
        if (sessionAge > maxInactiveTime) {
            this.logout();
            return true;
        }
        
        return false;
    }

    // Require re-authentication for sensitive operations
    requireReauth() {
        // Store current operation
        const pendingOperation = {
            action: 'sensitive',
            timestamp: Date.now()
        };
        localStorage.setItem('pendingOperation', JSON.stringify(pendingOperation));
        
        // Redirect to re-auth page or show modal
        return false;
    }
}

// Create global instance
const authManager = new AuthManager();

// Auto-check session timeout every minute
setInterval(() => {
    if (authManager.checkSessionTimeout()) {
        // Redirect to login if session expired
        if (!window.location.href.includes('login.html')) {
            window.location.href = 'login.html?session=expired';
        }
    }
}, 60000);
