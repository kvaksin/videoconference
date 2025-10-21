import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { v4 as uuidv4 } from 'uuid';

const Dashboard: React.FC = () => {
  const [roomId, setRoomId] = useState<string>('');
  const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(false);
  const { currentUser, logout } = useAuth();
  const { success, error } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    // Generate a default room ID
    setRoomId(uuidv4().substring(0, 8));
  }, []);

  const createRoom = (): void => {
    if (!roomId.trim()) {
      error('Please enter a room ID');
      return;
    }
    
    setIsCreatingRoom(true);
    // Navigate to meeting room
    navigate(`/meeting/${roomId}`);
  };

  const joinRoom = (): void => {
    if (!roomId.trim()) {
      error('Please enter a room ID');
      return;
    }
    
    navigate(`/meeting/${roomId}`);
  };

  const generateNewRoomId = (): void => {
    setRoomId(uuidv4().substring(0, 8));
  };

  const copyRoomId = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(roomId);
      success('Room ID copied to clipboard');
    } catch (err) {
      error('Failed to copy room ID');
    }
  };

  const handleSignout = async (): Promise<void> => {
    try {
      await logout();
      success('Signed out successfully');
    } catch (err) {
      error('Error signing out');
    }
  };

  const handleRoomIdChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setRoomId(e.target.value);
  };

  return (
    <div className="container">
      {/* Header */}
      <header style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>
            Welcome, {currentUser?.fullName || currentUser?.name}
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            Start or join a video conference
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {currentUser?.hasFullLicense && (
            <button 
              className="nav-btn secondary"
              onClick={() => navigate('/calendar')}
            >
              📅 Calendar
            </button>
          )}
          {(currentUser?.isAdmin || currentUser?.role === 'admin') && (
            <button 
              className="nav-btn secondary"
              onClick={() => navigate('/admin')}
            >
              ⚙️ Admin
            </button>
          )}
          <button 
            className="nav-btn danger"
            onClick={handleSignout}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Create/Join Room Card */}
        <div className="card">
          <h2 style={{ color: '#2c3e50', marginBottom: '1.5rem' }}>
            🎥 Video Conference
          </h2>
          
          <div className="form-group">
            <label htmlFor="roomId">Room ID</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={handleRoomIdChange}
                placeholder="Enter room ID"
                style={{ flex: 1 }}
              />
              <button 
                className="nav-btn secondary"
                onClick={generateNewRoomId}
                title="Generate new room ID"
              >
                🔄
              </button>
              <button 
                className="nav-btn secondary"
                onClick={copyRoomId}
                title="Copy room ID"
              >
                📋
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button 
              className="nav-btn primary"
              onClick={createRoom}
              disabled={isCreatingRoom}
              style={{ flex: 1 }}
            >
              {isCreatingRoom ? 'Creating...' : 'Create Room'}
            </button>
            <button 
              className="nav-btn secondary"
              onClick={joinRoom}
              style={{ flex: 1 }}
            >
              Join Room
            </button>
          </div>
        </div>

        {/* User Info Card */}
        <div className="card">
          <h2 style={{ color: '#2c3e50', marginBottom: '1.5rem' }}>
            👤 Account Information
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <strong>Name:</strong> {currentUser?.fullName || currentUser?.name}
            </div>
            <div>
              <strong>Email:</strong> {currentUser?.email}
            </div>
            <div>
              <strong>License:</strong> 
              <span style={{ 
                color: currentUser?.hasFullLicense ? '#28a745' : '#ffc107',
                fontWeight: 'bold',
                marginLeft: '0.5rem'
              }}>
                {currentUser?.hasFullLicense ? 'Full License' : 'Basic License'}
              </span>
            </div>
            {(currentUser?.isAdmin || currentUser?.role === 'admin') && (
              <div>
                <strong>Role:</strong> 
                <span style={{ color: '#dc3545', fontWeight: 'bold', marginLeft: '0.5rem' }}>
                  Administrator
                </span>
              </div>
            )}
          </div>

          {!currentUser?.hasFullLicense && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '6px',
              fontSize: '0.9rem'
            }}>
              <strong>Upgrade to Full License for:</strong>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                <li>Calendar integration</li>
                <li>Meeting scheduling</li>
                <li>Availability management</li>
                <li>ICS file exports</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="card">
        <h2 style={{ color: '#2c3e50', marginBottom: '1.5rem' }}>
          🚀 Quick Start Guide
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem'
        }}>
          <div>
            <h4 style={{ color: '#667eea', marginBottom: '0.5rem' }}>
              1. Start a Meeting
            </h4>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.4', margin: 0 }}>
              Click "Create Room" to start a new video conference. Share the room ID with participants.
            </p>
          </div>
          
          <div>
            <h4 style={{ color: '#667eea', marginBottom: '0.5rem' }}>
              2. Join a Meeting
            </h4>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.4', margin: 0 }}>
              Enter a room ID and click "Join Room" to participate in an existing meeting.
            </p>
          </div>
          
          <div>
            <h4 style={{ color: '#667eea', marginBottom: '0.5rem' }}>
              3. Share Your Screen
            </h4>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.4', margin: 0 }}>
              During a call, use the screen share button to present documents or applications.
            </p>
          </div>
          
          <div>
            <h4 style={{ color: '#667eea', marginBottom: '0.5rem' }}>
              4. Use Chat
            </h4>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.4', margin: 0 }}>
              Send text messages to other participants during the video call.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;