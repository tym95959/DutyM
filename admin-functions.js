// admin-functions.js - Admin-specific functions
class AdminFunctions {
    constructor() {
        this.currentUser = authManager.getCurrentUser();
        this.init();
    }

    async init() {
        // Wait for app initialization
        await this.waitForApp();
        
        // Load admin data
        await this.loadAdminData();
        
        // Setup admin event listeners
        this.setupAdminEventListeners();
        
        console.log('Admin functions initialized');
    }

    waitForApp() {
        return new Promise((resolve) => {
            const checkApp = () => {
                if (window.app && window.app.currentUser) {
                    resolve();
                } else {
                    setTimeout(checkApp, 100);
                }
            };
            checkApp();
        });
    }

    async loadAdminData() {
        try {
            const [users, leaves, changes, announcements] = await Promise.all([
                this.getAllUsers(),
                this.getAllLeaves(),
                this.getAllDutyChanges(),
                this.getAllAnnouncements()
            ]);

            // Update stats
            this.updateAdminStats(users, leaves, changes, announcements);
            
            // Update tables
            this.updateUsersTable(users);
            this.updateLeavesTable(leaves);
            this.updateChangesTable(changes);
            this.updateAnnouncementsTable(announcements);
            
            // Load settings
            await this.loadSettingsForm();

        } catch (error) {
            console.error('Error loading admin data:', error);
            app.showError('Failed to load admin data');
        }
    }

    async getAllUsers() {
        return authManager.getAllUsers();
    }

    async getAllLeaves(filters = {}) {
        let conditions = [];
        
        if (filters.type) {
            conditions.push({ field: 'type', operator: '==', value: filters.type });
        }
        
        if (filters.status) {
            conditions.push({ field: 'status', operator: '==', value: filters.status });
        }
        
        if (filters.dateFrom) {
            conditions.push({ field: 'date', operator: '>=', value: filters.dateFrom });
        }
        
        if (filters.dateTo) {
            conditions.push({ field: 'date', operator: '<=', value: filters.dateTo });
        }
        
        const result = await dbHelper.query(
            Collections.SICK_LEAVES,
            conditions,
            { field: 'date', direction: 'desc' }
        );

        return result.success ? result.data : [];
    }

    async getAllDutyChanges(filters = {}) {
        let conditions = [];
        
        if (filters.status) {
            conditions.push({ field: 'status', operator: '==', value: filters.status });
        }
        
        if (filters.dateFrom) {
            conditions.push({ field: 'changeDate', operator: '>=', value: filters.dateFrom });
        }
        
        if (filters.dateTo) {
            conditions.push({ field: 'changeDate', operator: '<=', value: filters.dateTo });
        }
        
        const result = await dbHelper.query(
            Collections.DUTY_CHANGES,
            conditions,
            { field: 'createdAt', direction: 'desc' }
        );

        return result.success ? result.data : [];
    }

    async getAllAnnouncements() {
        const result = await dbHelper.query(
            Collections.ANNOUNCEMENTS,
            [],
            { field: 'createdAt', direction: 'desc' }
        );

        return result.success ? result.data : [];
    }

    updateAdminStats(users, leaves, changes, announcements) {
        const totalUsers = users.filter(u => u.status === 'active').length;
        const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
        const pendingChanges = changes.filter(c => c.status === 'pending').length;
        const activeAnnouncements = announcements.filter(a => 
            new Date(a.expiryDate) >= new Date()
        ).length;

        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('pendingLeaves').textContent = pendingLeaves;
        document.getElementById('pendingChanges').textContent = pendingChanges;
        document.getElementById('activeAnnouncements').textContent = activeAnnouncements;
    }

    updateUsersTable(users) {
        const tbody = document.querySelector('#usersTable tbody');
        if (!tbody) return;

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <div class="user-avatar">
                            ${user.name.charAt(0)}
                        </div>
                        <div>
                            <div class="font-semibold">${user.name}</div>
                            <div class="text-muted text-xs">${user.username}</div>
                        </div>
                    </div>
                </td>
                <td>${user.RCNo}</td>
                <td>
                    <span class="badge ${
                        user.Level === 'Supervisor' || user.Level === 'Manager' ? 'badge-primary' :
                        user.Level === 'Staff' ? 'badge-success' : 'badge-secondary'
                    }">
                        ${user.Level}
                    </span>
                </td>
                <td>${user.department || '-'}</td>
                <td>
                    <span class="user-status ${user.status === 'active' ? 'active' : 'inactive'}"></span>
                    <span class="badge badge-${user.status === 'active' ? 'success' : 'danger'}">
                        ${user.status}
                    </span>
                </td>
                <td>
                    <div class="text-xs">
                        <span class="text-warning">SL: ${user.slBalance || 0}</span>
                        <span class="text-success ml-2">FRL: ${user.frlBalance || 0}</span>
                    </div>
                </td>
                <td>
                    <div class="actions">
                        <button class="btn-icon" onclick="admin.editUser('${user.RCNo}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="admin.resetPassword('${user.RCNo}')" title="Reset Password">
                            <i class="fas fa-key"></i>
                        </button>
                        <button class="btn-icon" onclick="admin.toggleUserStatus('${user.RCNo}')" title="${user.status === 'active' ? 'Deactivate' : 'Activate'}">
                            <i class="fas fa-${user.status === 'active' ? 'user-slash' : 'user-check'}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    updateLeavesTable(leaves) {
        const tbody = document.querySelector('#leavesTable tbody');
        if (!tbody) return;

        if (leaves.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted">
                        No leaves found
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = leaves.map(leave => `
            <tr>
                <td>${app.formatDate(leave.date)}</td>
                <td>
                    <div class="font-semibold">${leave.name}</div>
                    <div class="text-muted text-xs">RC ${leave.rcNumber}</div>
                </td>
                <td>
                    <span class="badge ${leave.type === 'SL' ? 'badge-warning' : 'badge-success'}">
                        ${leave.type}
                    </span>
                </td>
                <td>${leave.dutyTime}</td>
                <td>${leave.reason}</td>
                <td>${app.formatTime(leave.appliedAt)}</td>
                <td>
                    <span class="badge badge-${leave.status === 'approved' ? 'success' : 
                                           leave.status === 'rejected' ? 'danger' : 'warning'}">
                        ${leave.status}
                    </span>
                </td>
                <td>
                    ${leave.status === 'pending' ? `
                        <div class="actions">
                            <button class="btn-icon text-success" onclick="admin.approveLeave('${leave.id}')" title="Approve">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn-icon text-danger" onclick="admin.rejectLeave('${leave.id}')" title="Reject">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    ` : '-'}
                </td>
            </tr>
        `).join('');
    }

    updateChangesTable(changes) {
        const tbody = document.querySelector('#changesTable tbody');
        if (!tbody) return;

        if (changes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted">
                        No duty changes found
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = changes.map(change => `
            <tr>
                <td>${app.formatDate(change.changeDate)}</td>
                <td>
                    <div class="font-semibold">${change.requesterName}</div>
                    <div class="text-muted text-xs">RC ${change.requesterRc}</div>
                </td>
                <td>
                    <div class="font-semibold">${change.requestedName}</div>
                    <div class="text-muted text-xs">RC ${change.requestedRc}</div>
                </td>
                <td>
                    <div class="text-center">
                        <div>${change.requesterDutyTime}</div>
                        <div class="text-xs">↔</div>
                        <div>${change.requestedDutyTime}</div>
                    </div>
                </td>
                <td>${app.formatTime(change.createdAt)}</td>
                <td>
                    <span class="badge badge-${change.status === 'accepted' ? 'success' : 
                                              change.status === 'rejected' ? 'danger' : 'warning'}">
                        ${change.status}
                    </span>
                </td>
                <td>
                    ${change.status === 'pending' ? `
                        <div class="actions">
                            <button class="btn-icon text-success" onclick="admin.approveChange('${change.id}')" title="Approve">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn-icon text-danger" onclick="admin.rejectChange('${change.id}')" title="Reject">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    ` : '-'}
                </td>
            </tr>
        `).join('');
    }

    updateAnnouncementsTable(announcements) {
        const tbody = document.querySelector('#announcementsTable tbody');
        if (!tbody) return;

        if (announcements.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted">
                        No announcements found
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = announcements.map(announcement => `
            <tr>
                <td>${announcement.title}</td>
                <td>${announcement.content.length > 50 ? announcement.content.substring(0, 50) + '...' : announcement.content}</td>
                <td>
                    <span class="badge badge-light">
                        ${announcement.audience === 'all' ? 'All Users' : 'Specific'}
                    </span>
                </td>
                <td>${app.formatTime(announcement.createdAt?.toDate())}</td>
                <td>${app.formatDate(announcement.expiryDate)}</td>
                <td>
                    <span class="badge badge-${new Date(announcement.expiryDate) >= new Date() ? 'success' : 'danger'}">
                        ${new Date(announcement.expiryDate) >= new Date() ? 'Active' : 'Expired'}
                    </span>
                </td>
                <td>
                    <div class="actions">
                        <button class="btn-icon" onclick="admin.editAnnouncement('${announcement.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon text-danger" onclick="admin.deleteAnnouncement('${announcement.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    setupAdminEventListeners() {
        // Roster upload
        const uploadArea = document.getElementById('rosterUploadArea');
        const fileInput = document.getElementById('rosterFile');
        
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('active');
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('active');
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('active');
                
                if (e.dataTransfer.files.length) {
                    fileInput.files = e.dataTransfer.files;
                    this.handleRosterUpload(e.dataTransfer.files[0]);
                }
            });
            
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length) {
                    this.handleRosterUpload(e.target.files[0]);
                }
            });
        }
        
        // User search
        const userSearch = document.getElementById('userSearch');
        if (userSearch) {
            userSearch.addEventListener('input', (e) => {
                this.searchUsers(e.target.value);
            });
        }
        
        // Settings form
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSettings();
            });
        }
    }

    async handleRosterUpload(file) {
        if (!file) return;
        
        const validTypes = ['.xlsx', '.xls'];
        const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        
        if (!validTypes.includes(fileExtension)) {
            app.showError('Please upload an Excel file (.xlsx or .xls)');
            return;
        }
        
        // Show loading
        const uploadArea = document.getElementById('rosterUploadArea');
        uploadArea.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
            </div>
            <p>Processing roster file...</p>
        `;
        
        try {
            // Read Excel file
            const data = await this.readExcelFile(file);
            
            // Validate and process roster data
            const processedData = this.processRosterData(data);
            
            // Upload to Firestore
            await this.uploadRosterToFirestore(processedData);
            
            app.showSuccess('Roster uploaded successfully');
            
            // Reset upload area
            uploadArea.innerHTML = `
                <div class="file-upload-icon">
                    <i class="fas fa-cloud-upload-alt"></i>
                </div>
                <h4>Drop roster file here</h4>
                <p class="text-muted">or click to browse</p>
                <input type="file" id="rosterFile" accept=".xlsx,.xls" class="d-none">
                <p class="text-muted mt-2">Supports Excel files (.xlsx, .xls)</p>
            `;
            
            // Reload roster data
            await this.loadAdminData();
            
        } catch (error) {
            console.error('Error uploading roster:', error);
            app.showError('Failed to upload roster: ' + error.message);
            
            // Reset upload area
            uploadArea.innerHTML = `
                <div class="file-upload-icon">
                    <i class="fas fa-cloud-upload-alt"></i>
                </div>
                <h4>Drop roster file here</h4>
                <p class="text-muted">or click to browse</p>
                <input type="file" id="rosterFile" accept=".xlsx,.xls" class="d-none">
                <p class="text-muted mt-2">Supports Excel files (.xlsx, .xls)</p>
            `;
        }
    }

    async readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = (error) => {
                reject(error);
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    processRosterData(data) {
        const processedData = [];
        const errors = [];
        
        data.forEach((row, index) => {
            // Extract data based on expected columns
            const rosterItem = {
                rcNumber: row['RC No'] || row['RCNo'] || row['RC Number'],
                name: row['Name'] || row['Staff Name'],
                date: row['Date'],
                dutyTime: row['Duty Time'] || row['Time'],
                remarks: row['Remarks'] || '',
                uploadedBy: this.currentUser.rcNumber,
                uploadedAt: new Date().toISOString()
            };
            
            // Validate required fields
            if (!rosterItem.rcNumber || !rosterItem.date || !rosterItem.dutyTime) {
                errors.push(`Row ${index + 2}: Missing required fields`);
                return;
            }
            
            // Validate date format
            if (!this.isValidDate(rosterItem.date)) {
                errors.push(`Row ${index + 2}: Invalid date format`);
                return;
            }
            
            // Validate time format
            if (!this.isValidTime(rosterItem.dutyTime)) {
                errors.push(`Row ${index + 2}: Invalid time format`);
                return;
            }
            
            // Check if user exists
            const user = authManager.getUserByRC(rosterItem.rcNumber);
            if (!user) {
                errors.push(`Row ${index + 2}: User with RC ${rosterItem.rcNumber} not found`);
                return;
            }
            
            processedData.push(rosterItem);
        });
        
        if (errors.length > 0) {
            throw new Error(errors.join('\n'));
        }
        
        return processedData;
    }

    isValidDate(dateString) {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    }

    isValidTime(timeString) {
        // Accept HH:MM or HH:MM:SS format
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
        return timeRegex.test(timeString);
    }

    async uploadRosterToFirestore(data) {
        const batch = db.batch();
        
        data.forEach(item => {
            const docRef = db.collection(Collections.ROSTERS).doc();
            batch.set(docRef, item);
        });
        
        await batch.commit();
        
        // Log the activity
        await dbHelper.add(Collections.ACTIVITY_LOGS, {
            action: 'roster_upload',
            userId: this.currentUser.rcNumber,
            details: `Uploaded ${data.length} roster entries`,
            timestamp: new Date().toISOString()
        });
    }

    async addUser() {
        const form = document.getElementById('addUserForm');
        if (!form) return;
        
        const formData = new FormData(form);
        const userData = Object.fromEntries(formData);
        
        // Validation
        if (!userData.username || !userData.name || !userData.rcNumber || !userData.password) {
            app.showError('Please fill all required fields');
            return;
        }
        
        // Check if username already exists
        const existingUser = authManager.getUserByRC(userData.rcNumber);
        if (existingUser) {
            app.showError('User with this RC number already exists');
            return;
        }
        
        try {
            // Hash password
            const hashedPassword = await authManager.hashPassword(userData.password);
            
            // Create user object
            const newUser = {
                username: userData.username,
                name: userData.name,
                passwordHash: hashedPassword,
                Level: userData.level,
                RCNo: userData.rcNumber,
                email: userData.email || '',
                department: userData.department || '',
                phone: userData.phone || '',
                slBalance: parseInt(userData.slBalance) || 30,
                frlBalance: parseInt(userData.frlBalance) || 15,
                status: 'active',
                createdDate: new Date().toISOString()
            };
            
            // Add to local users array
            users.push(newUser);
            
            // Add to Firestore backup
            await dbHelper.add(Collections.USERS, newUser);
            
            // Close modal and show success
            app.closeModal('addUserModal');
            app.showSuccess('User added successfully');
            
            // Refresh user table
            await this.loadAdminData();
            
            // Reset form
            form.reset();
            
        } catch (error) {
            console.error('Error adding user:', error);
            app.showError('Failed to add user: ' + error.message);
        }
    }

    async editUser(rcNumber) {
        const user = authManager.getUserByRC(rcNumber);
        if (!user) {
            app.showError('User not found');
            return;
        }
        
        // Show edit modal with user data
        // Implementation similar to addUser but with existing data
        console.log('Edit user:', user);
    }

    async resetPassword(rcNumber) {
        const user = authManager.getUserByRC(rcNumber);
        if (!user) {
            app.showError('User not found');
            return;
        }
        
        const newPassword = prompt(`Enter new password for ${user.name} (RC ${rcNumber}):`);
        if (!newPassword) return;
        
        try {
            // Hash new password
            const hashedPassword = await authManager.hashPassword(newPassword);
            
            // Update local user
            user.passwordHash = hashedPassword;
            
            // Update Firestore backup
            await dbHelper.update(Collections.USERS, user.id || rcNumber, {
                passwordHash: hashedPassword,
                updatedAt: new Date().toISOString()
            });
            
            app.showSuccess('Password reset successfully');
            
        } catch (error) {
            console.error('Error resetting password:', error);
            app.showError('Failed to reset password');
        }
    }

    async toggleUserStatus(rcNumber) {
        const user = authManager.getUserByRC(rcNumber);
        if (!user) {
            app.showError('User not found');
            return;
        }
        
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        const confirmMessage = `Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} ${user.name}?`;
        
        if (!confirm(confirmMessage)) return;
        
        try {
            // Update local user
            user.status = newStatus;
            
            // Update Firestore backup
            await dbHelper.update(Collections.USERS, user.id || rcNumber, {
                status: newStatus,
                updatedAt: new Date().toISOString()
            });
            
            app.showSuccess(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
            
            // Refresh user table
            await this.loadAdminData();
            
        } catch (error) {
            console.error('Error toggling user status:', error);
            app.showError('Failed to update user status');
        }
    }

    async approveLeave(leaveId) {
        await this.updateLeaveStatus(leaveId, 'approved', 'Leave approved successfully');
    }

    async rejectLeave(leaveId) {
        await this.updateLeaveStatus(leaveId, 'rejected', 'Leave rejected successfully');
    }

    async updateLeaveStatus(leaveId, status, successMessage) {
        try {
            // Update leave status in Firestore
            await dbHelper.update(Collections.SICK_LEAVES, leaveId, {
                status: status,
                reviewedBy: this.currentUser.rcNumber,
                reviewedAt: new Date().toISOString()
            });
            
            // If approved, update user balance
            if (status === 'approved') {
                const leaveResult = await dbHelper.getById(Collections.SICK_LEAVES, leaveId);
                if (leaveResult.success) {
                    const leave = leaveResult.data;
                    authManager.updateUserBalance(leave.rcNumber, leave.type, 1);
                    
                    // Send notification to user
                    await app.sendNotification(
                        leave.rcNumber,
                        `Leave ${status === 'approved' ? 'Approved' : 'Rejected'}`,
                        `Your ${leave.type} for ${app.formatDate(leave.date)} has been ${status}`
                    );
                }
            }
            
            app.showSuccess(successMessage);
            
            // Refresh leaves table
            await this.loadAdminData();
            
        } catch (error) {
            console.error('Error updating leave status:', error);
            app.showError('Failed to update leave status');
        }
    }

    async approveChange(changeId) {
        await this.updateChangeStatus(changeId, 'accepted', 'Duty change approved successfully');
    }

    async rejectChange(changeId) {
        await this.updateChangeStatus(changeId, 'rejected', 'Duty change rejected successfully');
    }

    async updateChangeStatus(changeId, status, successMessage) {
        try {
            await dbHelper.update(Collections.DUTY_CHANGES, changeId, {
                status: status,
                reviewedBy: this.currentUser.rcNumber,
                reviewedAt: new Date().toISOString()
            });
            
            app.showSuccess(successMessage);
            
            // Refresh changes table
            await this.loadAdminData();
            
        } catch (error) {
            console.error('Error updating duty change status:', error);
            app.showError('Failed to update duty change status');
        }
    }

    async loadSettingsForm() {
        try {
            const result = await dbHelper.getById(Collections.SETTINGS, 'system');
            if (result.success) {
                const settings = result.data;
                const form = document.getElementById('settingsForm');
                
                // Populate form fields
                Object.keys(settings).forEach(key => {
                    const input = form.querySelector(`[name="${key}"]`);
                    if (input) {
                        if (input.type === 'checkbox') {
                            input.checked = settings[key];
                        } else if (input.type === 'select-multiple') {
                            // Handle multiple select
                            const values = settings[key];
                            Array.from(input.options).forEach(option => {
                                option.selected = values.includes(option.value);
                            });
                        } else {
                            input.value = settings[key];
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async saveSettings() {
        const form = document.getElementById('settingsForm');
        if (!form) return;
        
        const formData = new FormData(form);
        const settings = Object.fromEntries(formData);
        
        // Process checkbox values
        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            settings[checkbox.name] = checkbox.checked;
        });
        
        // Process multiple select values
        const multiSelects = form.querySelectorAll('select[multiple]');
        multiSelects.forEach(select => {
            settings[select.name] = Array.from(select.selectedOptions).map(option => option.value);
        });
        
        try {
            await dbHelper.update(Collections.SETTINGS, 'system', settings);
            app.showSuccess('Settings saved successfully');
        } catch (error) {
            console.error('Error saving settings:', error);
            app.showError('Failed to save settings');
        }
    }

    searchUsers(query) {
        const users = authManager.getAllUsers();
        const filteredUsers = users.filter(user => 
            user.name.toLowerCase().includes(query.toLowerCase()) ||
            user.username.toLowerCase().includes(query.toLowerCase()) ||
            user.RCNo.includes(query) ||
            user.department?.toLowerCase().includes(query.toLowerCase())
        );
        
        this.updateUsersTable(filteredUsers);
    }

    async filterLeaves() {
        const type = document.getElementById('leaveTypeFilter').value;
        const status = document.getElementById('leaveStatusFilter').value;
        const dateFrom = document.getElementById('leaveDateFrom').value;
        const dateTo = document.getElementById('leaveDateTo').value;
        
        const filters = {};
        if (type) filters.type = type;
        if (status) filters.status = status;
        if (dateFrom) filters.dateFrom = dateFrom;
        if (dateTo) filters.dateTo = dateTo;
        
        const leaves = await this.getAllLeaves(filters);
        this.updateLeavesTable(leaves);
    }

    async filterChanges() {
        const status = document.getElementById('changeStatusFilter').value;
        const dateFrom = document.getElementById('changeDateFrom').value;
        const dateTo = document.getElementById('changeDateTo').value;
        
        const filters = {};
        if (status) filters.status = status;
        if (dateFrom) filters.dateFrom = dateFrom;
        if (dateTo) filters.dateTo = dateTo;
        
        const changes = await this.getAllDutyChanges(filters);
        this.updateChangesTable(changes);
    }

    async deleteAnnouncement(announcementId) {
        if (!confirm('Are you sure you want to delete this announcement?')) return;
        
        try {
            await dbHelper.delete(Collections.ANNOUNCEMENTS, announcementId);
            app.showSuccess('Announcement deleted successfully');
            await this.loadAdminData();
        } catch (error) {
            console.error('Error deleting announcement:', error);
            app.showError('Failed to delete announcement');
        }
    }

    async showAnnouncementModal() {
        // Create and show announcement modal
        const modalHTML = `
            <div class="modal" id="announcementModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">Create Announcement</h3>
                        <button class="modal-close" onclick="app.closeModal('announcementModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="announcementForm">
                            <div class="form-group">
                                <label class="form-label">Title</label>
                                <input type="text" class="form-control" name="title" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Content</label>
                                <textarea class="form-control" name="content" rows="4" required></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Audience</label>
                                <select class="form-control" name="audience" required>
                                    <option value="all">All Users</option>
                                    <option value="specific">Specific Users</option>
                                </select>
                            </div>
                            
                            <div class="form-group" id="specificUsersContainer" style="display: none;">
                                <label class="form-label">Select Users</label>
                                <select class="form-control" name="specificUsers" multiple>
                                    ${authManager.getAllUsers().map(user => `
                                        <option value="${user.RCNo}">${user.name} (RC ${user.RCNo})</option>
                                    `).join('')}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Expiry Date</label>
                                <input type="date" class="form-control" name="expiryDate" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="app.closeModal('announcementModal')">Cancel</button>
                        <button class="btn btn-primary" onclick="admin.createAnnouncement()">Create</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to DOM
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
        
        // Show modal
        document.getElementById('announcementModal').classList.add('active');
        
        // Setup audience change listener
        const audienceSelect = document.querySelector('#announcementForm select[name="audience"]');
        const specificUsersContainer = document.getElementById('specificUsersContainer');
        
        audienceSelect.addEventListener('change', function() {
            specificUsersContainer.style.display = this.value === 'specific' ? 'block' : 'none';
        });
    }

    async createAnnouncement() {
        const form = document.getElementById('announcementForm');
        if (!form) return;
        
        const formData = new FormData(form);
        const announcementData = Object.fromEntries(formData);
        
        // Validation
        if (!announcementData.title || !announcementData.content || !announcementData.expiryDate) {
            app.showError('Please fill all required fields');
            return;
        }
        
        try {
            const finalAnnouncement = {
                title: announcementData.title,
                content: announcementData.content,
                audience: announcementData.audience === 'specific' ? 
                    Array.from(formData.getAll('specificUsers')).join(',') : 'all',
                createdBy: this.currentUser.rcNumber,
                createdAt: new Date().toISOString(),
                expiryDate: announcementData.expiryDate
            };
            
            await dbHelper.add(Collections.ANNOUNCEMENTS, finalAnnouncement);
            
            app.closeModal('announcementModal');
            app.showSuccess('Announcement created successfully');
            
            // Refresh announcements table
            await this.loadAdminData();
            
            // Remove modal from DOM
            const modal = document.getElementById('announcementModal');
            if (modal) modal.parentNode.removeChild(modal);
            
        } catch (error) {
            console.error('Error creating announcement:', error);
            app.showError('Failed to create announcement');
        }
    }

    downloadRosterTemplate() {
        // Create a sample Excel template
        const templateData = [
            ['RC No', 'Name', 'Date', 'Duty Time', 'Remarks'],
            ['001', 'John Smith', '2024-01-15', '08:00', 'Morning Shift'],
            ['002', 'Sarah Johnson', '2024-01-15', '16:00', 'Evening Shift']
        ];
        
        const worksheet = XLSX.utils.aoa_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Roster Template');
        
        // Generate and download file
        XLSX.writeFile(workbook, 'Roster_Template.xlsx');
    }

    async exportData() {
        try {
            const [users, leaves, changes, announcements] = await Promise.all([
                this.getAllUsers(),
                this.getAllLeaves(),
                this.getAllDutyChanges(),
                this.getAllAnnouncements()
            ]);
            
            // Create multiple sheets
            const usersSheet = XLSX.utils.json_to_sheet(users.map(u => ({
                'RC No': u.RCNo,
                'Username': u.username,
                'Name': u.name,
                'Level': u.Level,
                'Department': u.department,
                'Email': u.email,
                'Phone': u.phone,
                'SL Balance': u.slBalance,
                'FRL Balance': u.frlBalance,
                'Status': u.status
            })));
            
            const leavesSheet = XLSX.utils.json_to_sheet(leaves.map(l => ({
                'Date': l.date,
                'RC No': l.rcNumber,
                'Name': l.name,
                'Type': l.type,
                'Duty Time': l.dutyTime,
                'Reason': l.reason,
                'Applied At': l.appliedAt,
                'Status': l.status
            })));
            
            const changesSheet = XLSX.utils.json_to_sheet(changes.map(c => ({
                'Change Date': c.changeDate,
                'Requester RC': c.requesterRc,
                'Requester Name': c.requesterName,
                'Requested RC': c.requestedRc,
                'Requested Name': c.requestedName,
                'Requester Duty Time': c.requesterDutyTime,
                'Requested Duty Time': c.requestedDutyTime,
                'Status': c.status,
                'Created At': c.createdAt
            })));
            
            // Create workbook
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, usersSheet, 'Users');
            XLSX.utils.book_append_sheet(workbook, leavesSheet, 'Leaves');
            XLSX.utils.book_append_sheet(workbook, changesSheet, 'Duty Changes');
            
            // Download
            XLSX.writeFile(workbook, `Leave_System_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
            
            app.showSuccess('Data exported successfully');
            
        } catch (error) {
            console.error('Error exporting data:', error);
            app.showError('Failed to export data');
        }
    }
}

// Initialize admin functions
const admin = new AdminFunctions();
window.admin = admin;

// Extend app with admin methods
if (window.app) {
    window.app.showRosterUploadModal = function() {
        // Trigger file input click
        const fileInput = document.getElementById('rosterFile');
        if (fileInput) fileInput.click();
    };
    
    window.app.showAddUserModal = function() {
        const modal = document.getElementById('addUserModal');
        if (modal) modal.classList.add('active');
    };
    
    window.app.showAnnouncementModal = function() {
        admin.showAnnouncementModal();
    };
    
    window.app.showLeaveApprovalModal = function() {
        // Switch to leaves tab
        document.querySelector('[data-tab="leaves"]').click();
    };
    
    window.app.showReportsModal = function() {
        // Implementation for reports modal
        admin.exportData();
    };
    
    window.app.closeModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
    };
    
    window.app.filterLeaves = function() {
        admin.filterLeaves();
    };
    
    window.app.filterChanges = function() {
        admin.filterChanges();
    };
    
    window.app.saveSettings = function() {
        admin.saveSettings();
    };
    
    window.app.exportData = function() {
        admin.exportData();
    };
    
    window.app.downloadRosterTemplate = function() {
        admin.downloadRosterTemplate();
    };
    
    window.app.initAdminDashboard = function() {
        // Update user info
        this.updateUserInfo();
        
        // Setup admin event listeners
        admin.setupAdminEventListeners();
        
        // Load initial data
        admin.loadAdminData();
        
        console.log('Admin dashboard initialized');
    };
}
