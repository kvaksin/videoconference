class AdminPanel {
    constructor() {
        this.users = [];
        this.stats = {};
        this.initialize();
    }

    async initialize() {
        // Check authentication and admin privileges
        const isAuth = await requireAuth();
        if (!isAuth) return;
        
        if (!requireAdmin()) return;

        // Load data
        await this.loadSystemStats();
        await this.loadUsers();
        
        // Set up event listeners
        this.setupEventListeners();
    }

    async loadSystemStats() {
        try {
            const response = await fetch('/api/admin/stats', {
                credentials: 'include'
            });
            
            if (response.ok) {
                this.stats = await response.json();
                this.updateStatsDisplay();
            }
        } catch (error) {
            console.error('Error loading system stats:', error);
        }
    }

    updateStatsDisplay() {
        document.getElementById('totalUsers').textContent = this.stats.totalUsers || 0;
        document.getElementById('fullLicenseUsers').textContent = this.stats.fullLicenseUsers || 0;
        document.getElementById('basicUsers').textContent = this.stats.basicUsers || 0;
        document.getElementById('recentSignups').textContent = this.stats.recentSignups || 0;
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/admin/users', {
                credentials: 'include'
            });
            
            if (response.ok) {
                this.users = await response.json();
                this.renderUsersTable();
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        
        if (this.users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                        No users found
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.users.map(user => {
            const initials = user.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
            const createdDate = new Date(user.created_at).toLocaleDateString();
            const lastLogin = user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never';
            
            return `
                <tr>
                    <td>
                        <div class="user-info-cell">
                            <div class="user-avatar">${initials}</div>
                            <div class="user-details">
                                <h4>${user.full_name}</h4>
                                <p>ID: ${user.id}</p>
                            </div>
                        </div>
                    </td>
                    <td>${user.email}</td>
                    <td>
                        <span class="status-badge ${user.has_full_license ? 'full-license' : 'basic-license'}">
                            ${user.has_full_license ? 'Full License' : 'Basic License'}
                        </span>
                    </td>
                    <td>
                        <span class="status-badge ${user.is_admin ? 'admin' : 'user'}">
                            ${user.is_admin ? 'Admin' : 'User'}
                        </span>
                    </td>
                    <td>${createdDate}</td>
                    <td>${lastLogin}</td>
                    <td>
                        <div class="action-buttons">
                            ${user.has_full_license ? 
                                `<button class="action-btn downgrade" data-user-id="${user.id}" data-action="revoke">
                                    Revoke License
                                </button>` :
                                `<button class="action-btn upgrade" data-user-id="${user.id}" data-action="grant">
                                    Grant License
                                </button>`
                            }
                            ${!user.is_admin ? 
                                `<button class="action-btn promote" data-user-id="${user.id}" data-action="promote">
                                    Promote to Admin
                                </button>` :
                                user.id !== (window.authManager?.getCurrentUser()?.id) ?
                                `<button class="action-btn demote" data-user-id="${user.id}" data-action="demote">
                                    Demote from Admin
                                </button>` : ''
                            }
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Add event listeners for the action buttons
        this.setupActionButtonListeners();
    }

    setupActionButtonListeners() {
        const actionButtons = document.querySelectorAll('.action-btn');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const userId = parseInt(e.target.getAttribute('data-user-id'));
                const action = e.target.getAttribute('data-action');
                
                if (action === 'grant' || action === 'revoke') {
                    const hasFullLicense = action === 'grant';
                    this.toggleLicense(userId, hasFullLicense);
                } else if (action === 'promote' || action === 'demote') {
                    const isAdmin = action === 'promote';
                    this.toggleAdminStatus(userId, isAdmin);
                }
            });
        });
    }

    async toggleAdminStatus(userId, isAdmin) {
        console.log('Toggling admin status for user:', userId, 'to:', isAdmin);
        
        // Confirm action with user
        const action = isAdmin ? 'promote to admin' : 'demote from admin';
        const confirmMessage = `Are you sure you want to ${action} this user?`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        try {
            const response = await fetch(`/api/admin/users/${userId}/admin`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isAdmin }),
                credentials: 'include'
            });
            
            console.log('Admin status response:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Admin status response data:', data);
                this.showNotification(
                    `User ${isAdmin ? 'promoted to admin' : 'demoted from admin'} successfully`,
                    'success'
                );
                
                // Reload data
                await this.loadSystemStats();
                await this.loadUsers();
            } else {
                const error = await response.json();
                console.error('Server error:', error);
                this.showNotification(error.error || 'Failed to update admin status', 'error');
            }
        } catch (error) {
            console.error('Error toggling admin status:', error);
            this.showNotification('Network error. Please try again.', 'error');
        }
    }

    async toggleLicense(userId, hasFullLicense) {
        console.log('Toggling license for user:', userId, 'to:', hasFullLicense);
        
        try {
            const response = await fetch(`/api/admin/users/${userId}/license`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ hasFullLicense }),
                credentials: 'include'
            });
            
            console.log('Response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Response data:', data);
                this.showNotification(
                    `License ${hasFullLicense ? 'granted to' : 'revoked from'} ${data.user.fullName}`,
                    'success'
                );
                
                // Reload data
                await this.loadSystemStats();
                await this.loadUsers();
            } else {
                const error = await response.json();
                console.error('Server error:', error);
                this.showNotification(error.error || 'Failed to update license', 'error');
            }
        } catch (error) {
            console.error('Error toggling license:', error);
            this.showNotification('Network error. Please try again.', 'error');
        }
    }

    setupEventListeners() {
        // Create user button
        document.getElementById('createUserBtn').addEventListener('click', () => {
            this.showCreateUserModal();
        });

        // Close modal buttons
        document.getElementById('closeCreateModal').addEventListener('click', () => {
            this.hideCreateUserModal();
        });
        
        document.getElementById('cancelCreateUser').addEventListener('click', () => {
            this.hideCreateUserModal();
        });

        // Create user form
        document.getElementById('createUserForm').addEventListener('submit', (e) => {
            this.handleCreateUser(e);
        });

        // Close modal when clicking outside
        document.getElementById('createUserModal').addEventListener('click', (e) => {
            if (e.target.id === 'createUserModal') {
                this.hideCreateUserModal();
            }
        });
    }

    showCreateUserModal() {
        document.getElementById('createUserModal').style.display = 'flex';
        document.getElementById('newUserFullName').focus();
    }

    hideCreateUserModal() {
        document.getElementById('createUserModal').style.display = 'none';
        document.getElementById('createUserForm').reset();
    }

    async handleCreateUser(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const userData = {
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            password: formData.get('password'),
            isAdmin: formData.get('isAdmin') === 'on',
            hasFullLicense: formData.get('hasFullLicense') === 'on'
        };

        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.showNotification(`User ${data.user.fullName} created successfully`, 'success');
                
                this.hideCreateUserModal();
                
                // Reload data
                await this.loadSystemStats();
                await this.loadUsers();
            } else {
                const error = await response.json();
                this.showNotification(error.error || 'Failed to create user', 'error');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            this.showNotification('Network error. Please try again.', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notifications = document.getElementById('notifications');
        if (!notifications) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notifications.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});