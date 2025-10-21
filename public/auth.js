class AuthManager {
    constructor() {
        this.currentUser = null;
        this.initializeAuth();
    }

    async initializeAuth() {
        // Check if user is already authenticated
        await this.checkAuthStatus();
        
        // Set up event listeners
        this.setupEventListeners();
    }

    async checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/verify', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                
                // Redirect to dashboard if on login page
                if (window.location.pathname === '/login') {
                    window.location.href = '/dashboard';
                }
                
                return true;
            }
        } catch (error) {
            console.error('Auth check error:', error);
        }
        
        return false;
    }

    setupEventListeners() {
        // Sign in form
        const signinForm = document.getElementById('signinForm');
        if (signinForm) {
            signinForm.addEventListener('submit', (e) => this.handleSignin(e));
        }

        // Sign up form
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        // Toggle between signin and signup
        const showSignup = document.getElementById('showSignup');
        const showSignin = document.getElementById('showSignin');
        
        if (showSignup) {
            showSignup.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleAuthForm('signup');
            });
        }
        
        if (showSignin) {
            showSignin.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleAuthForm('signin');
            });
        }

        // Sign out button
        const signoutBtn = document.getElementById('signoutBtn');
        if (signoutBtn) {
            signoutBtn.addEventListener('click', (e) => this.handleSignout(e));
        }
    }

    toggleAuthForm(form) {
        const signinCard = document.querySelector('.auth-card:first-child');
        const signupCard = document.getElementById('signupCard');
        
        if (form === 'signup') {
            signinCard.style.display = 'none';
            signupCard.style.display = 'block';
        } else {
            signinCard.style.display = 'block';
            signupCard.style.display = 'none';
        }
    }

    async handleSignin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        
        const signinBtn = document.getElementById('signinBtn');
        this.setButtonLoading(signinBtn, true);
        
        try {
            const response = await fetch('/api/auth/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.currentUser = data.user;
                this.showNotification('Sign in successful!', 'success');
                
                // Redirect based on user role
                setTimeout(() => {
                    if (data.user.isAdmin) {
                        window.location.href = '/admin';
                    } else {
                        window.location.href = '/dashboard';
                    }
                }, 1000);
            } else {
                this.showNotification(data.error || 'Sign in failed', 'error');
            }
        } catch (error) {
            console.error('Signin error:', error);
            this.showNotification('Network error. Please try again.', 'error');
        } finally {
            this.setButtonLoading(signinBtn, false);
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const fullName = formData.get('fullName');
        const email = formData.get('email');
        const password = formData.get('password');
        
        // Client-side validation
        if (fullName.trim().length < 2) {
            this.showNotification('Full name must be at least 2 characters long', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showNotification('Password must be at least 6 characters long', 'error');
            return;
        }
        
        const signupBtn = document.getElementById('signupBtn');
        this.setButtonLoading(signupBtn, true);
        
        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fullName, email, password }),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.currentUser = data.user;
                this.showNotification('Account created successfully!', 'success');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
            } else {
                this.showNotification(data.error || 'Sign up failed', 'error');
            }
        } catch (error) {
            console.error('Signup error:', error);
            this.showNotification('Network error. Please try again.', 'error');
        } finally {
            this.setButtonLoading(signupBtn, false);
        }
    }

    async handleSignout(e) {
        e.preventDefault();
        
        try {
            const response = await fetch('/api/auth/signout', {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                this.currentUser = null;
                this.showNotification('Signed out successfully', 'success');
                
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1000);
            }
        } catch (error) {
            console.error('Signout error:', error);
            this.showNotification('Error signing out', 'error');
        }
    }

    setButtonLoading(button, loading) {
        const btnText = button.querySelector('.btn-text');
        const btnLoader = button.querySelector('.btn-loader');
        
        if (loading) {
            btnText.style.display = 'none';
            btnLoader.style.display = 'block';
            button.disabled = true;
        } else {
            btnText.style.display = 'block';
            btnLoader.style.display = 'none';
            button.disabled = false;
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

    // Utility method to get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Method to check if user has full license
    hasFullLicense() {
        return this.currentUser && this.currentUser.hasFullLicense;
    }

    // Method to check if user is admin
    isAdmin() {
        return this.currentUser && this.currentUser.isAdmin;
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Utility function to protect routes
async function requireAuth() {
    if (!window.authManager) {
        window.authManager = new AuthManager();
    }
    
    const isAuth = await window.authManager.checkAuthStatus();
    if (!isAuth && window.location.pathname !== '/login') {
        window.location.href = '/login';
        return false;
    }
    
    return true;
}

// Utility function to require full license
function requireFullLicense() {
    if (!window.authManager || !window.authManager.hasFullLicense()) {
        window.location.href = '/dashboard';
        return false;
    }
    return true;
}

// Utility function to require admin
function requireAdmin() {
    if (!window.authManager || !window.authManager.isAdmin()) {
        window.location.href = '/dashboard';
        return false;
    }
    return true;
}