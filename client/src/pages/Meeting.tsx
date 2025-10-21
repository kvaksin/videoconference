import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import io from 'socket.io-client';
import { ParticipantData, ChatMessage, ConnectionStatus } from '../types';

type SocketType = ReturnType<typeof io>;

const Meeting: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { success, error, info } = useNotification();
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<SocketType | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  
  // State
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [showChat, setShowChat] = useState<boolean>(false);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [displayName, setDisplayName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempDisplayName, setTempDisplayName] = useState<string>('');

  // Initialize display name when currentUser is available
  useEffect(() => {
    if (currentUser && !displayName) {
      setDisplayName(currentUser.fullName || currentUser.name || 'You');
    }
  }, [currentUser, displayName]);

  // WebRTC configuration
  const servers: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    if (!currentUser) {
      error('Please sign in to join the meeting');
      navigate('/');
      return;
    }

    if (!roomId) {
      error('Invalid room ID');
      navigate('/dashboard');
      return;
    }

    const initializeConnection = async (): Promise<void> => {
      try {
        // Initialize socket connection
        socketRef.current = io(process.env.NODE_ENV === 'production' 
          ? window.location.origin 
          : 'http://localhost:3001'
        );

        // Get user media
        await getUserMedia();
        
        // Setup WebRTC
        setupWebRTC();
        
        // Setup socket events
        setupSocketEvents();
        
        // Join room
        socketRef.current.emit('join-room', {
          roomId,
          userId: currentUser.id,
          userName: displayName
        });

        setConnectionStatus('connected');
        info(`Joined meeting room: ${roomId}`);
        
      } catch (err) {
        console.error('Failed to initialize connection:', err);
        error('Failed to join meeting. Please check your camera and microphone permissions.');
        setConnectionStatus('failed');
      }
    };

    initializeConnection();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, currentUser, error, navigate, info]);

  const getUserMedia = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing media devices:', err);
      throw new Error('Camera/microphone access denied');
    }
  };

  const setupWebRTC = (): void => {
    peerConnectionRef.current = new RTCPeerConnection(servers);
    
    // Add local stream to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnectionRef.current?.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    peerConnectionRef.current.ontrack = (event: RTCTrackEvent) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    peerConnectionRef.current.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate && socketRef.current && roomId) {
        socketRef.current.emit('ice-candidate', {
          roomId,
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    peerConnectionRef.current.onconnectionstatechange = () => {
      const state = peerConnectionRef.current?.connectionState as ConnectionStatus;
      setConnectionStatus(state);
      
      if (state === 'connected') {
        success('Connected to peer');
      } else if (state === 'disconnected' || state === 'failed') {
        error('Peer connection lost');
      }
    };
  };

  const setupSocketEvents = (): void => {
    if (!socketRef.current) return;

    // Handle user joined
    socketRef.current.on('user-joined', (data: ParticipantData) => {
      info(`${data.userName} joined the meeting`);
      setParticipants(prev => [...prev.filter(p => p.userId !== data.userId), data]);
    });

    // Handle user left
    socketRef.current.on('user-left', (data: ParticipantData) => {
      info(`${data.userName} left the meeting`);
      setParticipants(prev => prev.filter(p => p.userId !== data.userId));
    });

    // Handle offer
    socketRef.current.on('offer', async (data: { offer: RTCSessionDescriptionInit }) => {
      try {
        await peerConnectionRef.current?.setRemoteDescription(data.offer);
        const answer = await peerConnectionRef.current?.createAnswer();
        await peerConnectionRef.current?.setLocalDescription(answer!);
        
        socketRef.current?.emit('answer', {
          roomId,
          answer
        });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    });

    // Handle answer
    socketRef.current.on('answer', async (data: { answer: RTCSessionDescriptionInit }) => {
      try {
        await peerConnectionRef.current?.setRemoteDescription(data.answer);
      } catch (err) {
        console.error('Error handling answer:', err);
      }
    });

    // Handle ICE candidate
    socketRef.current.on('ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
      try {
        await peerConnectionRef.current?.addIceCandidate(data.candidate);
      } catch (err) {
        console.error('Error handling ICE candidate:', err);
      }
    });

    // Handle chat messages
    socketRef.current.on('chat-message', (data: { userId: string; userName: string; message: string }) => {
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        userId: data.userId,
        userName: data.userName,
        message: data.message,
        timestamp: new Date()
      }]);
    });

    // Handle participants list
    socketRef.current.on('participants-update', (data: { participants: ParticipantData[] }) => {
      setParticipants(data.participants || []);
    });

    // Handle name changes
    socketRef.current.on('name-changed', (data: { userId: string; newName: string }) => {
      setParticipants(prev => prev.map(p => 
        p.userId === data.userId ? { ...p, userName: data.newName } : p
      ));
      
      if (data.userId !== currentUser?.id) {
        info(`User changed their name to "${data.newName}"`);
      }
    });
  };

  const createOffer = async (): Promise<void> => {
    try {
      const offer = await peerConnectionRef.current?.createOffer();
      await peerConnectionRef.current?.setLocalDescription(offer!);
      
      socketRef.current?.emit('offer', {
        roomId,
        offer
      });
    } catch (err) {
      console.error('Error creating offer:', err);
    }
  };

  const toggleMute = (): void => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = (): void => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const shareScreen = async (): Promise<void> => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        await getUserMedia();
        setIsScreenSharing(false);
        success('Screen sharing stopped');
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        localStreamRef.current = screenStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        // Replace video track in peer connection
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current?.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
        
        setIsScreenSharing(true);
        success('Screen sharing started');
        
        // Handle screen share end
        videoTrack.onended = async () => {
          await getUserMedia();
          setIsScreenSharing(false);
          info('Screen sharing ended');
        };
      }
    } catch (err) {
      console.error('Screen sharing error:', err);
      error('Failed to share screen');
    }
  };

  const sendChatMessage = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    
    if (!newMessage.trim() || !socketRef.current || !currentUser) return;
    
    socketRef.current.emit('chat-message', {
      roomId,
      userId: currentUser.id,
      userName: displayName,
      message: newMessage.trim()
    });
    
    setNewMessage('');
  };

  const startEditingName = (): void => {
    setTempDisplayName(displayName);
    setIsEditingName(true);
  };

  const cancelEditingName = (): void => {
    setIsEditingName(false);
    setTempDisplayName('');
  };

  const saveDisplayName = (): void => {
    if (tempDisplayName.trim() && tempDisplayName.trim() !== displayName) {
      const newName = tempDisplayName.trim();
      setDisplayName(newName);
      
      // Notify other participants of name change
      if (socketRef.current) {
        socketRef.current.emit('name-change', {
          roomId,
          userId: currentUser?.id,
          newName: newName
        });
      }
      
      success(`Display name updated to "${newName}"`);
    }
    setIsEditingName(false);
    setTempDisplayName('');
  };

  const handleNameInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      saveDisplayName();
    } else if (e.key === 'Escape') {
      cancelEditingName();
    }
  };

  const copyMeetingLink = async (): Promise<void> => {
    try {
      const meetingLink = `${window.location.origin}/meeting/${roomId}`;
      await navigator.clipboard.writeText(meetingLink);
      success('Meeting link copied to clipboard');
    } catch (err) {
      error('Failed to copy meeting link');
    }
  };

  const leaveMeeting = (): void => {
    cleanup();
    navigate('/dashboard');
    success('Left the meeting');
  };

  const cleanup = (): void => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  const getConnectionStatusColor = (): string => {
    switch (connectionStatus) {
      case 'connected': return '#28a745';
      case 'connecting': return '#ffc107';
      case 'disconnected': return '#dc3545';
      case 'failed': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setNewMessage(e.target.value);
  };

  // Responsive self-view sizing
  const getSelfViewSize = () => {
    const width = window.innerWidth;
    if (width < 768) {
      return { width: '160px', height: '120px', top: '1rem', right: '1rem' };
    } else if (width < 1024) {
      return { width: '200px', height: '150px', top: '1rem', right: '1rem' };
    } else {
      return { width: '240px', height: '180px', top: '1rem', right: '1rem' };
    }
  };

  const [selfViewSize, setSelfViewSize] = useState(getSelfViewSize());

  useEffect(() => {
    const handleResize = () => {
      setSelfViewSize(getSelfViewSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{
      height: '100vh',
      background: '#1a1a1a',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <header style={{
        background: '#2c3e50',
        color: 'white',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ margin: 0, marginBottom: '0.25rem' }}>
            Meeting Room: {roomId}
          </h2>
          <div style={{ 
            fontSize: '0.9rem', 
            opacity: 0.8,
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <span>👤 {participants.length + 1} participant(s)</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: getConnectionStatusColor()
              }}></div>
              {connectionStatus}
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            className="nav-btn secondary"
            onClick={copyMeetingLink}
          >
            📋 Copy Link
          </button>
          <button 
            className="nav-btn danger"
            onClick={leaveMeeting}
          >
            📞 Leave Meeting
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        display: 'flex',
        position: 'relative'
      }}>
        {/* Video Area */}
        <div style={{ 
          flex: 1, 
          position: 'relative',
          background: '#000',
          borderRadius: '12px',
          margin: '1rem',
          overflow: 'hidden'
        }}>
          {/* Remote Video (Main/Large) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              position: 'absolute',
              top: 0,
              left: 0
            }}
          />
          
          {/* No remote video placeholder */}
          {(!remoteVideoRef.current?.srcObject) && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontSize: '1.2rem',
              textAlign: 'center',
              zIndex: 1
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.7 }}>
                📹
              </div>
              <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
                Waiting for participants to join
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                Share the meeting link to invite others
              </div>
            </div>
          )}
          
          {/* Remote participant name overlay */}
          <div style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: '500',
            zIndex: 2
          }}>
            {participants.length > 0 ? participants[0].userName : 'Waiting for participant...'}
          </div>

          {/* Self-view (Picture-in-Picture) */}
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            width: selfViewSize.width,
            height: selfViewSize.height,
            background: '#000',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '3px solid #667eea',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            zIndex: 10,
            transition: 'all 0.3s ease'
          }}>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)' // Mirror effect for self-view
              }}
            />
            
            {/* Self-view name overlay with edit capability */}
            <div style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              right: '0',
              background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
              color: 'white',
              padding: '0.75rem 0.5rem 0.5rem 0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.85rem'
            }}>
              {isEditingName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                  <input
                    type="text"
                    value={tempDisplayName}
                    onChange={(e) => setTempDisplayName(e.target.value)}
                    onKeyDown={handleNameInputKeyPress}
                    onBlur={saveDisplayName}
                    autoFocus
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '4px',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.85rem',
                      flex: 1,
                      minWidth: '100px'
                    }}
                    placeholder="Enter your name"
                  />
                  <button
                    onClick={saveDisplayName}
                    style={{
                      background: '#28a745',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    ✓
                  </button>
                  <button
                    onClick={cancelEditingName}
                    style={{
                      background: '#dc3545',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <span>
                    {displayName} {isScreenSharing && '(Screen)'}
                  </span>
                  <button
                    onClick={startEditingName}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '4px',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      marginLeft: '0.5rem'
                    }}
                    title="Edit display name"
                  >
                    ✏️
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Connection status indicator */}
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            left: '1rem',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            zIndex: 2
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: getConnectionStatusColor()
            }}></div>
            <span style={{ textTransform: 'capitalize' }}>{connectionStatus}</span>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div style={{
            width: '350px',
            background: 'white',
            borderLeft: '1px solid #e1e8ed',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid #e1e8ed',
              background: '#f8f9fa'
            }}>
              <h3 style={{ margin: 0, color: '#2c3e50' }}>💬 Chat</h3>
            </div>
            
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {chatMessages.map((msg) => (
                <div key={msg.id} style={{
                  padding: '0.75rem',
                  background: msg.userId === currentUser?.id ? '#667eea' : '#f1f3f4',
                  color: msg.userId === currentUser?.id ? 'white' : '#333',
                  borderRadius: '8px',
                  alignSelf: msg.userId === currentUser?.id ? 'flex-end' : 'flex-start',
                  maxWidth: '80%'
                }}>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    opacity: 0.8, 
                    marginBottom: '0.25rem' 
                  }}>
                    {msg.userName} • {msg.timestamp.toLocaleTimeString()}
                  </div>
                  <div>{msg.message}</div>
                </div>
              ))}
            </div>
            
            <form onSubmit={sendChatMessage} style={{
              padding: '1rem',
              borderTop: '1px solid #e1e8ed',
              display: 'flex',
              gap: '0.5rem'
            }}>
              <input
                type="text"
                value={newMessage}
                onChange={handleMessageChange}
                placeholder="Type a message..."
                style={{ flex: 1, fontSize: '0.9rem' }}
              />
              <button 
                type="submit" 
                className="nav-btn primary"
                style={{ padding: '0.5rem 1rem' }}
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{
        background: '#2c3e50',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <button 
          onClick={toggleMute}
          style={{
            padding: '1rem',
            borderRadius: '50%',
            border: 'none',
            background: isMuted ? '#dc3545' : '#28a745',
            color: 'white',
            fontSize: '1.2rem',
            cursor: 'pointer',
            width: '50px',
            height: '50px'
          }}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🎤'}
        </button>

        <button 
          onClick={toggleVideo}
          style={{
            padding: '1rem',
            borderRadius: '50%',
            border: 'none',
            background: isVideoOff ? '#dc3545' : '#28a745',
            color: 'white',
            fontSize: '1.2rem',
            cursor: 'pointer',
            width: '50px',
            height: '50px'
          }}
          title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isVideoOff ? '📹' : '📷'}
        </button>

        <button 
          onClick={shareScreen}
          style={{
            padding: '1rem',
            borderRadius: '50%',
            border: 'none',
            background: isScreenSharing ? '#ffc107' : '#6c757d',
            color: 'white',
            fontSize: '1.2rem',
            cursor: 'pointer',
            width: '50px',
            height: '50px'
          }}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          🖥️
        </button>

        <button 
          onClick={() => setShowChat(!showChat)}
          style={{
            padding: '1rem',
            borderRadius: '50%',
            border: 'none',
            background: showChat ? '#667eea' : '#6c757d',
            color: 'white',
            fontSize: '1.2rem',
            cursor: 'pointer',
            width: '50px',
            height: '50px'
          }}
          title="Toggle chat"
        >
          💬
        </button>

        <button 
          onClick={createOffer}
          style={{
            padding: '1rem',
            borderRadius: '50%',
            border: 'none',
            background: '#17a2b8',
            color: 'white',
            fontSize: '1.2rem',
            cursor: 'pointer',
            width: '50px',
            height: '50px'
          }}
          title="Initiate connection"
        >
          🤝
        </button>
      </div>
    </div>
  );
};

export default Meeting;