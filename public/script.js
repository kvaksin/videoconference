class VideoConference {
    constructor() {
        this.socket = io();
        this.localStream = null;
        this.remoteStream = null;
        this.peerConnection = null;
        this.dataChannel = null;
        this.currentRoomId = null;
        this.isVideoEnabled = true;
        this.isAudioEnabled = true;
        this.isScreenSharing = false;
        this.currentUser = null;
        
        this.configuration = {
            iceServers: [
                {
                    urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
                }
            ],
            iceCandidatePoolSize: 10,
        };
        
        this.initializeAuth();
    }
    
    async initializeAuth() {
        // Check if user is authenticated
        if (window.authManager) {
            const isAuth = await window.authManager.checkAuthStatus();
            if (isAuth) {
                this.currentUser = window.authManager.getCurrentUser();
                this.updateUserHeader();
            }
        }
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupSocketListeners();
    }
    
    initializeElements() {
        this.localVideo = document.getElementById('localVideo');
        this.remoteVideo = document.getElementById('remoteVideo');
        this.remoteVideoWrapper = document.getElementById('remoteVideoWrapper');
        this.roomIdInput = document.getElementById('roomId');
        this.joinRoomBtn = document.getElementById('joinRoom');
        this.createRoomBtn = document.getElementById('createRoom');
        this.toggleVideoBtn = document.getElementById('toggleVideo');
        this.toggleAudioBtn = document.getElementById('toggleAudio');
        this.shareScreenBtn = document.getElementById('shareScreen');
        this.endCallBtn = document.getElementById('endCall');
        this.messageInput = document.getElementById('messageInput');
        this.sendMessageBtn = document.getElementById('sendMessage');
        this.chatMessages = document.getElementById('chatMessages');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.roomInfo = document.getElementById('roomInfo');
        this.currentRoomIdSpan = document.getElementById('currentRoomId');
        this.copyMeetingLinkBtn = document.getElementById('copyRoomId');
        this.notifications = document.getElementById('notifications');
        this.userHeader = document.getElementById('userHeader');
        this.currentUserName = document.getElementById('currentUserName');
        this.headerSignoutBtn = document.getElementById('headerSignoutBtn');
    }
    
    updateUserHeader() {
        if (this.currentUser && this.userHeader && this.currentUserName) {
            this.userHeader.style.display = 'flex';
            this.currentUserName.textContent = this.currentUser.fullName;
        }
    }
    
    setupEventListeners() {
        this.createRoomBtn.addEventListener('click', () => this.createRoom());
        this.joinRoomBtn.addEventListener('click', () => this.joinRoom());
        this.toggleVideoBtn.addEventListener('click', () => this.toggleVideo());
        this.toggleAudioBtn.addEventListener('click', () => this.toggleAudio());
        this.shareScreenBtn.addEventListener('click', () => this.toggleScreenShare());
        this.endCallBtn.addEventListener('click', () => this.endCall());
        this.sendMessageBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        this.copyMeetingLinkBtn.addEventListener('click', () => this.copyMeetingLink());
        
        // Header signout button
        if (this.headerSignoutBtn) {
            this.headerSignoutBtn.addEventListener('click', () => {
                if (window.authManager) {
                    window.authManager.handleSignout(new Event('click'));
                }
            });
        }
    }
    
    setupSocketListeners() {
        this.socket.on('room-created', (roomId) => {
            this.currentRoomId = roomId;
            this.showRoomInfo(roomId);
            this.showNotification(`Room created: ${roomId}`, 'success');
        });
        
        this.socket.on('room-joined', (roomId) => {
            this.currentRoomId = roomId;
            this.showRoomInfo(roomId);
            this.showNotification(`Joined room: ${roomId}`, 'success');
        });
        
        this.socket.on('user-joined', async () => {
            this.showNotification('Another user joined the room', 'info');
            await this.createOffer();
        });
        
        this.socket.on('offer', async (offer) => {
            await this.handleOffer(offer);
        });
        
        this.socket.on('answer', async (answer) => {
            await this.handleAnswer(answer);
        });
        
        this.socket.on('ice-candidate', async (candidate) => {
            await this.handleIceCandidate(candidate);
        });
        
        this.socket.on('user-left', () => {
            this.handleUserLeft();
        });
        
        this.socket.on('error', (error) => {
            this.showNotification(error, 'error');
        });
    }
    
    async initializeMedia() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            this.localVideo.srcObject = this.localStream;
            this.updateConnectionStatus('Connected');
            return true;
        } catch (error) {
            this.showNotification('Error accessing media devices: ' + error.message, 'error');
            return false;
        }
    }
    
    async createRoom() {
        if (await this.initializeMedia()) {
            this.socket.emit('create-room');
        }
    }
    
    async joinRoom() {
        const roomId = this.roomIdInput.value.trim();
        if (!roomId) {
            this.showNotification('Please enter a room ID', 'error');
            return;
        }
        
        if (await this.initializeMedia()) {
            this.socket.emit('join-room', roomId);
        }
    }
    
    async createPeerConnection() {
        this.peerConnection = new RTCPeerConnection(this.configuration);
        
        // Add local stream tracks
        this.localStream.getTracks().forEach(track => {
            this.peerConnection.addTrack(track, this.localStream);
        });
        
        // Handle remote stream
        this.peerConnection.ontrack = (event) => {
            this.remoteStream = event.streams[0];
            this.remoteVideo.srcObject = this.remoteStream;
            this.remoteVideoWrapper.style.display = 'block';
        };
        
        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('ice-candidate', {
                    roomId: this.currentRoomId,
                    candidate: event.candidate
                });
            }
        };
        
        // Create data channel for messaging
        this.dataChannel = this.peerConnection.createDataChannel('messages', {
            ordered: true
        });
        
        this.dataChannel.onopen = () => {
            console.log('Data channel opened');
        };
        
        this.dataChannel.onmessage = (event) => {
            this.displayMessage(JSON.parse(event.data), false);
        };
        
        // Handle incoming data channel
        this.peerConnection.ondatachannel = (event) => {
            const channel = event.channel;
            channel.onmessage = (event) => {
                this.displayMessage(JSON.parse(event.data), false);
            };
        };
    }
    
    async createOffer() {
        await this.createPeerConnection();
        
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        
        this.socket.emit('offer', {
            roomId: this.currentRoomId,
            offer: offer
        });
    }
    
    async handleOffer(offer) {
        await this.createPeerConnection();
        
        await this.peerConnection.setRemoteDescription(offer);
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        
        this.socket.emit('answer', {
            roomId: this.currentRoomId,
            answer: answer
        });
    }
    
    async handleAnswer(answer) {
        await this.peerConnection.setRemoteDescription(answer);
    }
    
    async handleIceCandidate(candidate) {
        if (this.peerConnection) {
            await this.peerConnection.addIceCandidate(candidate);
        }
    }
    
    handleUserLeft() {
        this.remoteVideoWrapper.style.display = 'none';
        this.remoteVideo.srcObject = null;
        this.showNotification('User left the room', 'info');
        
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
    }
    
    toggleVideo() {
        this.isVideoEnabled = !this.isVideoEnabled;
        const videoTrack = this.localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = this.isVideoEnabled;
        }
        this.toggleVideoBtn.classList.toggle('disabled', !this.isVideoEnabled);
    }
    
    toggleAudio() {
        this.isAudioEnabled = !this.isAudioEnabled;
        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = this.isAudioEnabled;
        }
        this.toggleAudioBtn.classList.toggle('disabled', !this.isAudioEnabled);
    }
    
    async toggleScreenShare() {
        if (this.isScreenSharing) {
            // Switch back to camera
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            this.replaceVideoTrack(stream.getVideoTracks()[0]);
            this.isScreenSharing = false;
            this.shareScreenBtn.classList.remove('active');
        } else {
            // Start screen sharing
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: true
                });
                this.replaceVideoTrack(stream.getVideoTracks()[0]);
                this.isScreenSharing = true;
                this.shareScreenBtn.classList.add('active');
                
                // Handle screen share end
                stream.getVideoTracks()[0].onended = () => {
                    this.toggleScreenShare();
                };
            } catch (error) {
                this.showNotification('Error sharing screen: ' + error.message, 'error');
            }
        }
    }
    
    replaceVideoTrack(newTrack) {
        if (this.peerConnection) {
            const sender = this.peerConnection.getSenders().find(s =>
                s.track && s.track.kind === 'video'
            );
            if (sender) {
                sender.replaceTrack(newTrack);
            }
        }
        
        // Update local video
        const videoTracks = this.localStream.getVideoTracks();
        videoTracks.forEach(track => track.stop());
        this.localStream.removeTrack(videoTracks[0]);
        this.localStream.addTrack(newTrack);
    }
    
    endCall() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        
        if (this.peerConnection) {
            this.peerConnection.close();
        }
        
        this.socket.emit('leave-room', this.currentRoomId);
        
        this.localVideo.srcObject = null;
        this.remoteVideo.srcObject = null;
        this.remoteVideoWrapper.style.display = 'none';
        this.roomInfo.style.display = 'none';
        this.updateConnectionStatus('Disconnected');
        this.currentRoomId = null;
        this.showNotification('Call ended', 'info');
    }
    
    sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || !this.dataChannel || this.dataChannel.readyState !== 'open') {
            return;
        }
        
        const messageData = {
            text: message,
            timestamp: new Date().toLocaleTimeString(),
            sender: this.currentUser ? this.currentUser.fullName : 'You'
        };
        
        this.dataChannel.send(JSON.stringify(messageData));
        this.displayMessage(messageData, true);
        this.messageInput.value = '';
    }
    
    displayMessage(messageData, isOwn) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isOwn ? 'own' : 'remote'}`;
        
        messageElement.innerHTML = `
            <div class="message-sender">${isOwn ? 'You' : 'Remote'}</div>
            <div class="message-text">${messageData.text}</div>
            <div class="message-time">${messageData.timestamp}</div>
        `;
        
        this.chatMessages.appendChild(messageElement);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    showRoomInfo(roomId) {
        this.currentRoomIdSpan.textContent = roomId;
        this.roomInfo.style.display = 'block';
    }
    
    copyMeetingLink() {
        const meetingUrl = `${window.location.origin}/meeting.html?room=${this.currentRoomId}`;
        navigator.clipboard.writeText(meetingUrl).then(() => {
            this.showNotification('Meeting link copied to clipboard', 'success');
        }).catch(err => {
            console.error('Failed to copy meeting link:', err);
            this.showNotification('Failed to copy meeting link', 'error');
        });
    }
    
    updateConnectionStatus(status) {
        this.connectionStatus.textContent = status;
        this.connectionStatus.className = status.toLowerCase();
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        this.notifications.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    // Wait a moment for authManager to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
    new VideoConference();
});