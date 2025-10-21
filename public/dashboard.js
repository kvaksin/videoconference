class Dashboard {
    constructor() {
        this.user = null;
        this.meetings = [];
        this.initialize();
    }

    async initialize() {
        // Check authentication
        const isAuth = await requireAuth();
        if (!isAuth) return;

        // Load user data
        await this.loadUserData();
        
        // Update UI based on user
        this.updateUI();
        
        // Load user statistics
        await this.loadUserStats();
        
        // Set up event listeners
        this.setupEventListeners();
    }

    async loadUserData() {
        try {
            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            });
            
            if (response.ok) {
                this.user = await response.json();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    updateUI() {
        if (!this.user) return;

        // Update user info
        document.getElementById('userName').textContent = this.user.fullName;
        document.getElementById('userEmail').textContent = this.user.email;

        // Update license badge
        const licenseBadge = document.getElementById('licenseBadge');
        if (this.user.hasFullLicense) {
            licenseBadge.className = 'license-badge full';
            licenseBadge.textContent = '✨ Full License';
        } else {
            licenseBadge.className = 'license-badge basic';
            licenseBadge.textContent = '📋 Basic License';
        }

        // Show/hide navigation buttons
        if (this.user.hasFullLicense) {
            document.getElementById('calendarBtn').style.display = 'inline-block';
            document.getElementById('calendarAccessBtn').style.display = 'block';
            document.getElementById('schedulingLinkSection').style.display = 'block';
            document.getElementById('shareUnavailable').style.display = 'none';
            
            // Update scheduling link
            const schedulingLink = document.getElementById('schedulingLink');
            schedulingLink.value = `${window.location.origin}/schedule/${this.user.id}`;
            
            // Enable calendar features
            this.enableCalendarFeatures();
        }

        if (this.user.isAdmin) {
            document.getElementById('adminBtn').style.display = 'inline-block';
        }
    }

    enableCalendarFeatures() {
        // Update calendar feature descriptions
        document.getElementById('calendarDescription').textContent = 
            'Manage your calendar, set availability, and let others book meetings with you.';

        // Enable feature list items
        const features = [
            'icsCalendar',
            'outlookSync', 
            'schedulingTool',
            'automaticMeetings',
            'availabilityManagement'
        ];

        features.forEach(featureId => {
            const feature = document.getElementById(featureId);
            feature.className = 'feature-enabled';
            feature.querySelector('.feature-icon').textContent = '✅';
        });

        // Hide upgrade notice
        document.getElementById('upgradeNotice').style.display = 'none';
    }

    async loadUserStats() {
        if (!this.user || !this.user.hasFullLicense) {
            return;
        }

        try {
            const response = await fetch('/api/calendar/meetings', {
                credentials: 'include'
            });
            
            if (response.ok) {
                this.meetings = await response.json();
                this.updateStatsDisplay();
            }
        } catch (error) {
            console.error('Error loading user stats:', error);
        }
    }

    updateStatsDisplay() {
        const totalMeetings = this.meetings.length;
        const now = new Date();
        const upcomingMeetings = this.meetings.filter(meeting => 
            new Date(meeting.start_time) > now
        ).length;

        document.getElementById('totalMeetings').textContent = totalMeetings;
        document.getElementById('upcomingMeetings').textContent = upcomingMeetings;
    }

    setupEventListeners() {
        // Copy scheduling link
        const copyLinkBtn = document.getElementById('copyLinkBtn');
        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', () => {
                const schedulingLink = document.getElementById('schedulingLink');
                schedulingLink.select();
                document.execCommand('copy');
                this.showNotification('Scheduling link copied to clipboard!', 'success');
            });
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

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});