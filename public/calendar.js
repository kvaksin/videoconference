// Calendar Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Ensure auth manager is available
    if (!window.authManager) {
        window.authManager = new AuthManager();
    }
    
    // Wait for authentication to be ready
    setTimeout(() => {
        // Check if user has full license
        if (!requireFullLicense()) {
            return;
        }
        
        // Initialize calendar functionality
        initializeCalendar();
        
        // Set up event listeners
        setupEventListeners();
        
        // Load user data and calendar
        loadUserData();
        loadAvailability();
        loadMeetings();
        
        // Set up timezone
        setupTimezone();
    }, 100);
});

let currentDate = new Date();
let currentView = 'month';
let userTimezone = 'UTC';

// Initialize calendar
function initializeCalendar() {
    renderCalendar();
    updateCurrentMonthDisplay();
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
        updateCurrentMonthDisplay();
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
        updateCurrentMonthDisplay();
    });
    
    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            renderCalendar();
        });
    });
    
    // Availability form
    document.getElementById('availabilityForm').addEventListener('submit', saveAvailability);
    
    // Quick actions
    document.getElementById('createMeetingBtn').addEventListener('click', openCreateMeetingModal);
    document.getElementById('downloadIcsBtn').addEventListener('click', downloadICS);
    document.getElementById('copyLinkBtn').addEventListener('click', copySchedulingLink);
    document.getElementById('openSchedulingPageBtn').addEventListener('click', openSchedulingPage);
    document.getElementById('syncOutlookBtn').addEventListener('click', syncWithOutlook);
    
    // Modal events
    document.getElementById('closeMeetingModal').addEventListener('click', closeCreateMeetingModal);
    document.getElementById('cancelCreateMeeting').addEventListener('click', closeCreateMeetingModal);
    document.getElementById('createMeetingForm').addEventListener('submit', createMeeting);
    
    // Timezone change
    document.getElementById('timezone').addEventListener('change', function() {
        userTimezone = this.value;
        saveTimezone();
        loadMeetings();
        renderCalendar();
    });
}

// Load user data
async function loadUserData() {
    try {
        const user = window.authManager ? window.authManager.getCurrentUser() : null;
        if (user) {
            // Generate scheduling link
            const schedulingLink = `${window.location.origin}/schedule?user=${user.id}`;
            document.getElementById('schedulingLink').value = schedulingLink;
            
            // Set timezone if available
            if (user.timezone) {
                document.getElementById('timezone').value = user.timezone;
                userTimezone = user.timezone;
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Setup timezone
function setupTimezone() {
    // Try to detect user's timezone
    try {
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const timezoneSelect = document.getElementById('timezone');
        
        // Check if detected timezone is in our options
        const option = Array.from(timezoneSelect.options).find(opt => opt.value === detectedTimezone);
        if (option) {
            timezoneSelect.value = detectedTimezone;
            userTimezone = detectedTimezone;
        }
        
        // Get timezone from URL if provided
        const urlParams = new URLSearchParams(window.location.search);
        const urlTimezone = urlParams.get('timezone');
        if (urlTimezone) {
            const decodedTimezone = decodeURIComponent(urlTimezone);
            const urlOption = Array.from(timezoneSelect.options).find(opt => opt.value === decodedTimezone);
            if (urlOption) {
                timezoneSelect.value = decodedTimezone;
                userTimezone = decodedTimezone;
            }
        }
    } catch (error) {
        console.error('Error setting up timezone:', error);
    }
}

// Save timezone
async function saveTimezone() {
    try {
        const response = await fetch('/api/auth/update-timezone', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ timezone: userTimezone })
        });
        
        if (!response.ok) {
            throw new Error('Failed to save timezone');
        }
    } catch (error) {
        console.error('Error saving timezone:', error);
    }
}

// Load availability
async function loadAvailability() {
    try {
        const response = await fetch('/api/calendar/availability', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const availability = await response.json();
            populateAvailabilityForm(availability);
        }
    } catch (error) {
        console.error('Error loading availability:', error);
    }
    
    // Initialize form with default days
    initializeAvailabilityForm();
}

// Initialize availability form
function initializeAvailabilityForm() {
    const daySettings = document.getElementById('daySettings');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    daySettings.innerHTML = '';
    
    days.forEach((day, index) => {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day-setting';
        dayDiv.innerHTML = `
            <label>${day}</label>
            <input type="checkbox" id="day-${index}" data-day="${day.toLowerCase()}">
            <div class="time-inputs">
                <input type="time" id="start-${index}" data-day="${day.toLowerCase()}" value="09:00">
                <span>to</span>
                <input type="time" id="end-${index}" data-day="${day.toLowerCase()}" value="17:00">
            </div>
        `;
        daySettings.appendChild(dayDiv);
    });
}

// Populate availability form
function populateAvailabilityForm(availability) {
    if (!availability || !Array.isArray(availability)) return;
    
    availability.forEach(slot => {
        const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            .indexOf(slot.day_of_week.toLowerCase());
        
        if (dayIndex !== -1) {
            const checkbox = document.getElementById(`day-${dayIndex}`);
            const startTime = document.getElementById(`start-${dayIndex}`);
            const endTime = document.getElementById(`end-${dayIndex}`);
            
            if (checkbox) checkbox.checked = true;
            if (startTime) startTime.value = slot.start_time;
            if (endTime) endTime.value = slot.end_time;
        }
    });
}

// Save availability
async function saveAvailability(event) {
    event.preventDefault();
    
    const availability = [];
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    days.forEach((day, index) => {
        const checkbox = document.getElementById(`day-${index}`);
        const startTime = document.getElementById(`start-${index}`);
        const endTime = document.getElementById(`end-${index}`);
        
        if (checkbox && checkbox.checked && startTime && endTime) {
            availability.push({
                day_of_week: day,
                start_time: startTime.value,
                end_time: endTime.value
            });
        }
    });
    
    try {
        const response = await fetch('/api/calendar/availability', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ 
                availability,
                timezone: userTimezone 
            })
        });
        
        if (response.ok) {
            showNotification('Availability saved successfully!', 'success');
        } else {
            throw new Error('Failed to save availability');
        }
    } catch (error) {
        console.error('Error saving availability:', error);
        showNotification('Error saving availability', 'error');
    }
}

// Load meetings
async function loadMeetings() {
    try {
        const response = await fetch('/api/calendar/meetings', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const meetings = await response.json();
            displayMeetings(meetings);
            renderCalendar(); // Re-render calendar with meetings
        }
    } catch (error) {
        console.error('Error loading meetings:', error);
        document.getElementById('meetingsList').innerHTML = '<div class="empty-state">Error loading meetings</div>';
    }
}

// Display meetings
function displayMeetings(meetings) {
    const meetingsList = document.getElementById('meetingsList');
    
    if (!meetings || meetings.length === 0) {
        meetingsList.innerHTML = '<div class="empty-state">No upcoming meetings</div>';
        return;
    }
    
    // Sort meetings by date
    meetings.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    
    // Filter upcoming meetings
    const now = new Date();
    const upcomingMeetings = meetings.filter(meeting => new Date(meeting.start_time) > now);
    
    if (upcomingMeetings.length === 0) {
        meetingsList.innerHTML = '<div class="empty-state">No upcoming meetings</div>';
        return;
    }
    
    meetingsList.innerHTML = upcomingMeetings.map(meeting => {
        const startTime = new Date(meeting.start_time);
        const endTime = new Date(meeting.end_time);
        
        return `
            <div class="meeting-item">
                <h4>${escapeHtml(meeting.title)}</h4>
                <p class="meeting-time">
                    ${formatDateTime(startTime)} - ${formatTime(endTime)}
                </p>
                ${meeting.description ? `<p>${escapeHtml(meeting.description)}</p>` : ''}
                ${meeting.participant_name ? `<p>With: ${escapeHtml(meeting.participant_name)}</p>` : ''}
                <div class="meeting-actions">
                    <button onclick="joinMeeting('${meeting.id}')">Join Meeting</button>
                    <button onclick="downloadMeetingICS('${meeting.id}')">Download ICS</button>
                    <button onclick="copyMeetingLink('${meeting.id}')">Copy Link</button>
                </div>
            </div>
        `;
    }).join('');
}

// Render calendar
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    
    if (currentView === 'month') {
        renderMonthView(calendarGrid);
    } else if (currentView === 'week') {
        renderWeekView(calendarGrid);
    } else if (currentView === 'day') {
        renderDayView(calendarGrid);
    }
}

// Render month view
function renderMonthView(container) {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    let html = '<div class="calendar-month">';
    
    // Header days
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        html += `<div class="calendar-header-day">${day}</div>`;
    });
    
    // Calendar days
    const currentDateObj = new Date();
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const isToday = date.toDateString() === currentDateObj.toDateString();
        const isCurrentMonth = date.getMonth() === currentDate.getMonth();
        const classes = ['calendar-day'];
        
        if (!isCurrentMonth) classes.push('other-month');
        if (isToday) classes.push('today');
        
        html += `
            <div class="${classes.join(' ')}" data-date="${date.toISOString().split('T')[0]}">
                <div class="day-number">${date.getDate()}</div>
                <div class="day-meetings"></div>
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    // Add click listeners to days
    container.querySelectorAll('.calendar-day').forEach(day => {
        day.addEventListener('click', () => {
            const date = day.dataset.date;
            openCreateMeetingModal(date);
        });
    });
}

// Render week view (simplified)
function renderWeekView(container) {
    container.innerHTML = '<div class="empty-state">Week view coming soon...</div>';
}

// Render day view (simplified)
function renderDayView(container) {
    container.innerHTML = '<div class="empty-state">Day view coming soon...</div>';
}

// Update current month display
function updateCurrentMonthDisplay() {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthDisplay = document.getElementById('currentMonth');
    monthDisplay.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
}

// Modal functions
function openCreateMeetingModal(date = null) {
    const modal = document.getElementById('createMeetingModal');
    modal.style.display = 'flex';
    
    if (date) {
        document.getElementById('meetingDate').value = date;
    }
}

function closeCreateMeetingModal() {
    const modal = document.getElementById('createMeetingModal');
    modal.style.display = 'none';
    document.getElementById('createMeetingForm').reset();
}

// Create meeting
async function createMeeting(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const meetingData = {
        title: formData.get('title'),
        description: formData.get('description'),
        date: formData.get('date'),
        startTime: formData.get('startTime'),
        endTime: formData.get('endTime'),
        participantEmail: formData.get('participantEmail'),
        participantName: formData.get('participantName'),
        timezone: userTimezone
    };
    
    try {
        const response = await fetch('/api/calendar/meetings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(meetingData)
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification('Meeting created successfully!', 'success');
            closeCreateMeetingModal();
            loadMeetings();
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create meeting');
        }
    } catch (error) {
        console.error('Error creating meeting:', error);
        showNotification('Error creating meeting: ' + error.message, 'error');
    }
}

// Utility functions
function joinMeeting(meetingId) {
    window.open(`/meeting.html?id=${meetingId}`, '_blank');
}

function downloadMeetingICS(meetingId) {
    window.open(`/api/calendar/meetings/${meetingId}/ics`, '_blank');
}

function copyMeetingLink(meetingId) {
    const link = `${window.location.origin}/meeting.html?id=${meetingId}`;
    navigator.clipboard.writeText(link).then(() => {
        showNotification('Meeting link copied to clipboard!', 'success');
    });
}

function copySchedulingLink() {
    const link = document.getElementById('schedulingLink').value;
    navigator.clipboard.writeText(link).then(() => {
        showNotification('Scheduling link copied to clipboard!', 'success');
    });
}

function openSchedulingPage() {
    const link = document.getElementById('schedulingLink').value;
    window.open(link, '_blank');
}

function downloadICS() {
    window.open('/api/calendar/ics', '_blank');
}

function syncWithOutlook() {
    showNotification('Outlook sync feature coming soon!', 'info');
}

function formatDateTime(date) {
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: userTimezone
    }).format(date);
}

function formatTime(date) {
    return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: userTimezone
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
    notification.textContent = message;
    
    notifications.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('createMeetingModal');
    if (event.target === modal) {
        closeCreateMeetingModal();
    }
});

// Handle escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeCreateMeetingModal();
    }
});