// Meeting Room JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize meeting functionality
    initializeMeeting();
});

let socket;
let localStream;
let remoteStream;
let peerConnection;
let currentMeetingId;
let currentRoomId;
let isVideoEnabled = true;
let isAudioEnabled = true;
let isInCall = false;

// WebRTC configuration
const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

// Initialize meeting
async function initializeMeeting() {
    try {
        // Get meeting details from URL
        const urlParams = new URLSearchParams(window.location.search);
        currentMeetingId = urlParams.get('id');
        currentRoomId = urlParams.get('room');
        
        if (currentMeetingId) {
            // Load scheduled meeting details
            await loadMeetingDetails(currentMeetingId);
        } else if (currentRoomId) {
            // Direct room join
            setupDirectRoom();
        } else {
            // No meeting specified, redirect to dashboard
            window.location.href = '/dashboard';
            return;
        }
        
        // Initialize socket connection
        initializeSocket();
        
        // Setup event listeners
        setupEventListeners();
        
        // Check if meeting is ready to join
        checkMeetingAvailability();
        
    } catch (error) {
        console.error('Error initializing meeting:', error);
        showNotification('Error loading meeting', 'error');
    }
}

// Load meeting details for scheduled meetings
async function loadMeetingDetails(meetingId) {
    try {
        const response = await fetch(`/api/calendar/meetings/${meetingId}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const meeting = await response.json();
            displayMeetingInfo(meeting);
            currentRoomId = meeting.id; // Use meeting ID as room ID
        } else {
            throw new Error('Meeting not found');
        }
    } catch (error) {
        console.error('Error loading meeting details:', error);
        showNotification('Error loading meeting details', 'error');
        // Fallback to direct room mode
        setupDirectRoom();
    }
}

// Setup direct room (non-scheduled meeting)
function setupDirectRoom() {
    document.getElementById('meetingTitle').textContent = `Meeting Room: ${currentRoomId}`;
    document.getElementById('meetingDescription').textContent = 'Video conference room';
    document.getElementById('meetingTime').textContent = 'Available now';
    document.getElementById('meetingHost').textContent = 'Direct access';
    
    // Hide ICS download button for non-scheduled meetings
    const downloadBtn = document.getElementById('downloadIcsBtn');
    if (downloadBtn) {
        downloadBtn.style.display = 'none';
    }
}

// Display meeting information
function displayMeetingInfo(meeting) {
    document.getElementById('meetingTitle').textContent = meeting.title;
    document.getElementById('meetingDescription').textContent = meeting.description || '';
    
    const startTime = new Date(meeting.start_time);
    const endTime = new Date(meeting.end_time);
    document.getElementById('meetingTime').textContent = `${formatDateTime(startTime)} - ${formatTime(endTime)}`;
    document.getElementById('meetingHost').textContent = meeting.host_name || 'Meeting Host';
}

// Check if meeting is available to join
function checkMeetingAvailability() {
    const now = new Date();
    const meetingWaiting = document.getElementById('meetingWaiting');
    const joinButton = document.getElementById('joinVideoCallBtn');
    const earlyJoinBtn = document.getElementById('earlyJoinBtn');
    
    // For direct rooms, always allow joining
    if (!currentMeetingId) {
        meetingWaiting.style.display = 'none';
        return;
    }
    
    // For scheduled meetings, check timing
    // For now, always allow joining (can be enhanced with time checks)
    meetingWaiting.style.display = 'none';
    
    if (earlyJoinBtn) {
        earlyJoinBtn.addEventListener('click', joinMeeting);
    }
}

// Initialize socket connection
function initializeSocket() {
    socket = io();
    
    socket.on('connect', () => {
        console.log('Connected to server');
        updateConnectionStatus('Connected');
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        updateConnectionStatus('Disconnected');
    });
    
    socket.on('user-joined', (data) => {
        console.log('User joined:', data);
        showNotification(`${data.userId} joined the meeting`, 'info');
    });
    
    socket.on('user-left', (data) => {
        console.log('User left:', data);
        showNotification(`${data.userId} left the meeting`, 'info');
        if (remoteStream) {
            remoteStream.getTracks().forEach(track => track.stop());
            remoteStream = null;
            document.getElementById('remoteVideoWrapper').style.display = 'none';
        }
    });
    
    socket.on('offer', async (data) => {
        console.log('Received offer');
        await handleOffer(data.offer);
    });
    
    socket.on('answer', async (data) => {
        console.log('Received answer');
        await handleAnswer(data.answer);
    });
    
    socket.on('ice-candidate', async (data) => {
        console.log('Received ICE candidate');
        await handleIceCandidate(data.candidate);
    });
    
    socket.on('message', (data) => {
        displayMessage(data.message, data.sender, false);
    });
    
    socket.on('error', (error) => {
        console.error('Socket error:', error);
        showNotification('Connection error: ' + error.message, 'error');
    });
}

// Setup event listeners
function setupEventListeners() {
    // Join meeting button
    const joinBtn = document.getElementById('joinVideoCallBtn');
    if (joinBtn) {
        joinBtn.addEventListener('click', joinMeeting);
    }
    
    // Video controls
    document.getElementById('toggleVideo').addEventListener('click', toggleVideo);
    document.getElementById('toggleAudio').addEventListener('click', toggleAudio);
    document.getElementById('shareScreen').addEventListener('click', shareScreen);
    document.getElementById('endCall').addEventListener('click', endCall);
    
    // Chat functionality
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendMessage');
    
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Download ICS button
    const downloadIcsBtn = document.getElementById('downloadIcsBtn');
    if (downloadIcsBtn && currentMeetingId) {
        downloadIcsBtn.addEventListener('click', downloadICS);
    }
}

// Join meeting
async function joinMeeting() {
    try {
        // Get user media
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        // Display local video
        const localVideo = document.getElementById('localVideo');
        localVideo.srcObject = localStream;
        
        // Show video container
        document.getElementById('videoContainer').style.display = 'block';
        document.getElementById('meetingWaiting').style.display = 'none';
        
        // Join room via socket
        socket.emit('join-room', { roomId: currentRoomId });
        
        // Create peer connection
        createPeerConnection();
        
        // Add local stream to peer connection
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
        
        isInCall = true;
        updateConnectionStatus('In Call');
        
        showNotification('Joined meeting successfully', 'success');
        
    } catch (error) {
        console.error('Error joining meeting:', error);
        showNotification('Failed to access camera/microphone', 'error');
    }
}

// Create peer connection
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(rtcConfig);
    
    // Handle remote stream
    peerConnection.ontrack = (event) => {
        console.log('Received remote track');
        remoteStream = event.streams[0];
        const remoteVideo = document.getElementById('remoteVideo');
        remoteVideo.srcObject = remoteStream;
        document.getElementById('remoteVideoWrapper').style.display = 'block';
    };
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                roomId: currentRoomId,
                candidate: event.candidate
            });
        }
    };
    
    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        updateConnectionStatus(peerConnection.connectionState);
    };
}

// Handle offer
async function handleOffer(offer) {
    if (!peerConnection) {
        createPeerConnection();
        
        // Add local stream if available
        if (localStream) {
            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream);
            });
        }
    }
    
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    socket.emit('answer', {
        roomId: currentRoomId,
        answer: answer
    });
}

// Handle answer
async function handleAnswer(answer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

// Handle ICE candidate
async function handleIceCandidate(candidate) {
    if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
}

// Toggle video
function toggleVideo() {
    if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            isVideoEnabled = videoTrack.enabled;
            
            const videoBtn = document.getElementById('toggleVideo');
            const icon = videoBtn.querySelector('.icon');
            icon.textContent = isVideoEnabled ? '📹' : '📹❌';
            videoBtn.classList.toggle('disabled', !isVideoEnabled);
        }
    }
}

// Toggle audio
function toggleAudio() {
    if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            isAudioEnabled = audioTrack.enabled;
            
            const audioBtn = document.getElementById('toggleAudio');
            const icon = audioBtn.querySelector('.icon');
            icon.textContent = isAudioEnabled ? '🎤' : '🎤❌';
            audioBtn.classList.toggle('disabled', !isAudioEnabled);
        }
    }
}

// Share screen
async function shareScreen() {
    try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
        });
        
        // Replace video track
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnection.getSenders().find(s => 
            s.track && s.track.kind === 'video'
        );
        
        if (sender) {
            await sender.replaceTrack(videoTrack);
        }
        
        // Update local video
        const localVideo = document.getElementById('localVideo');
        localVideo.srcObject = screenStream;
        
        // Handle screen share end
        videoTrack.onended = () => {
            // Switch back to camera
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then(stream => {
                    const videoTrack = stream.getVideoTracks()[0];
                    sender.replaceTrack(videoTrack);
                    localVideo.srcObject = stream;
                    localStream = stream;
                });
        };
        
        showNotification('Screen sharing started', 'success');
        
    } catch (error) {
        console.error('Error sharing screen:', error);
        showNotification('Failed to share screen', 'error');
    }
}

// End call
function endCall() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        remoteStream = null;
    }
    
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    if (socket) {
        socket.emit('leave-room', { roomId: currentRoomId });
    }
    
    // Hide video container
    document.getElementById('videoContainer').style.display = 'none';
    document.getElementById('remoteVideoWrapper').style.display = 'none';
    document.getElementById('meetingWaiting').style.display = 'block';
    
    isInCall = false;
    updateConnectionStatus('Disconnected');
    
    showNotification('Call ended', 'info');
}

// Send message
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (message && socket) {
        socket.emit('message', {
            roomId: currentRoomId,
            message: message
        });
        
        displayMessage(message, 'You', true);
        messageInput.value = '';
    }
}

// Display message in chat
function displayMessage(message, sender, isOwn) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isOwn ? 'own' : 'other'}`;
    
    messageDiv.innerHTML = `
        <div class="message-sender">${escapeHtml(sender)}</div>
        <div class="message-content">${escapeHtml(message)}</div>
        <div class="message-time">${new Date().toLocaleTimeString()}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Update connection status
function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connectionStatus');
    statusElement.textContent = status;
    statusElement.className = status.toLowerCase().replace(/\s+/g, '-');
}

// Download ICS file
function downloadICS() {
    if (currentMeetingId) {
        const link = document.createElement('a');
        link.href = `/api/calendar/meetings/${currentMeetingId}/ics`;
        link.download = `meeting-${currentMeetingId}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Calendar file downloaded', 'success');
    }
}

// Utility functions
function formatDateTime(date) {
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
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

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (isInCall) {
        endCall();
    }
});

// Handle visibility change (tab switching)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && isInCall) {
        // Optionally pause video when tab is hidden
        console.log('Tab hidden, meeting continues in background');
    } else if (!document.hidden && isInCall) {
        console.log('Tab visible, meeting active');
    }
});