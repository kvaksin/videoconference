// Booking Confirmation Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Get meeting details from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const meetingId = urlParams.get('meeting');
    const success = urlParams.get('success');
    
    if (success === 'true' && meetingId) {
        loadMeetingDetails(meetingId);
    } else {
        // Redirect to dashboard if no valid booking
        window.location.href = '/dashboard';
    }
    
    // Set up event listeners
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Download ICS button
    const downloadIcsBtn = document.getElementById('downloadIcsBtn');
    if (downloadIcsBtn) {
        downloadIcsBtn.addEventListener('click', downloadMeetingICS);
    }
    
    // Join meeting button
    const joinMeetingBtn = document.getElementById('joinMeetingBtn');
    if (joinMeetingBtn) {
        joinMeetingBtn.addEventListener('click', joinMeeting);
    }
    
    // Copy meeting link button
    const copyMeetingLinkBtn = document.getElementById('copyMeetingLinkBtn');
    if (copyMeetingLinkBtn) {
        copyMeetingLinkBtn.addEventListener('click', copyMeetingLink);
    }
}

// Load meeting details
async function loadMeetingDetails(meetingId) {
    try {
        const response = await fetch(`/api/calendar/meetings/${meetingId}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const meeting = await response.json();
            displayMeetingDetails(meeting);
        } else {
            throw new Error('Failed to load meeting details');
        }
    } catch (error) {
        console.error('Error loading meeting details:', error);
        showNotification('Error loading meeting details', 'error');
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 3000);
    }
}

// Display meeting details
function displayMeetingDetails(meeting) {
    const meetingDetails = document.getElementById('meetingDetails');
    const startTime = new Date(meeting.start_time);
    const endTime = new Date(meeting.end_time);
    
    meetingDetails.innerHTML = `
        <div class="detail-item">
            <h3>📅 ${escapeHtml(meeting.title)}</h3>
            ${meeting.description ? `<p class="meeting-description">${escapeHtml(meeting.description)}</p>` : ''}
        </div>
        
        <div class="detail-item">
            <strong>🕒 Date & Time:</strong>
            <p>${formatDateTime(startTime)} - ${formatTime(endTime)}</p>
        </div>
        
        ${meeting.participant_name ? `
        <div class="detail-item">
            <strong>👤 Participant:</strong>
            <p>${escapeHtml(meeting.participant_name)}</p>
        </div>
        ` : ''}
        
        <div class="detail-item">
            <strong>🔗 Meeting Link:</strong>
            <p class="meeting-link">${window.location.origin}/meeting.html?id=${meeting.id}</p>
        </div>
        
        <div class="detail-item">
            <strong>🆔 Meeting ID:</strong>
            <p class="meeting-id">${meeting.id}</p>
        </div>
    `;
    
    // Store meeting ID for other functions
    window.currentMeetingId = meeting.id;
}

// Download meeting ICS
function downloadMeetingICS() {
    if (window.currentMeetingId) {
        const downloadUrl = `/api/calendar/meetings/${window.currentMeetingId}/ics`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `meeting-${window.currentMeetingId}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Calendar file downloaded!', 'success');
    }
}

// Join meeting
function joinMeeting() {
    if (window.currentMeetingId) {
        const meetingUrl = `/meeting.html?id=${window.currentMeetingId}`;
        window.open(meetingUrl, '_blank');
    }
}

// Copy meeting link
function copyMeetingLink() {
    if (window.currentMeetingId) {
        const meetingUrl = `${window.location.origin}/meeting.html?id=${window.currentMeetingId}`;
        
        navigator.clipboard.writeText(meetingUrl).then(() => {
            showNotification('Meeting link copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Failed to copy meeting link:', err);
            
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = meetingUrl;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showNotification('Meeting link copied to clipboard!', 'success');
            } catch (fallbackErr) {
                showNotification('Failed to copy meeting link', 'error');
            }
            document.body.removeChild(textArea);
        });
    }
}

// Utility functions
function formatDateTime(date) {
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function formatTime(date) {
    return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    const notifications = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    notifications.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}