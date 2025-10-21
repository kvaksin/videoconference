import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Meeting, OrganizerInfo } from '../types';

interface LocationState {
  meeting: Meeting;
  organizer: OrganizerInfo;
}

const BookingSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  const { meeting, organizer } = state || {};

  if (!meeting || !organizer) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>
            ❌ Booking Information Not Found
          </h2>
          <p style={{ marginBottom: '2rem' }}>
            Unable to display booking confirmation details.
          </p>
          <button 
            className="nav-btn primary"
            onClick={() => navigate('/')}
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const formatDateTime = (dateTime: string): string => {
    return new Date(dateTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const copyMeetingLink = async (): Promise<void> => {
    try {
      const meetingLink = `${window.location.origin}/meeting/${meeting.roomId}`;
      await navigator.clipboard.writeText(meetingLink);
      alert('Meeting link copied to clipboard!');
    } catch (err) {
      alert('Failed to copy link');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
      padding: '2rem 1rem'
    }}>
      <div className="container" style={{ maxWidth: '600px' }}>
        {/* Success Message */}
        <div className="card" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: '#28a745',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '2.5rem'
          }}>
            ✅
          </div>
          <h1 style={{ color: '#28a745', marginBottom: '0.5rem' }}>
            Meeting Booked Successfully!
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            Your video conference has been scheduled and confirmed
          </p>
        </div>

        {/* Meeting Details */}
        <div className="card">
          <h2 style={{ color: '#2c3e50', marginBottom: '1.5rem' }}>
            📅 Meeting Details
          </h2>
          
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              display: 'grid',
              gap: '1rem'
            }}>
              <div style={{
                padding: '1rem',
                background: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e1e8ed'
              }}>
                <strong style={{ color: '#2c3e50' }}>Meeting Title:</strong><br />
                {meeting.title || 'Video Conference Meeting'}
              </div>
              
              <div style={{
                padding: '1rem',
                background: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e1e8ed'
              }}>
                <strong style={{ color: '#2c3e50' }}>Date & Time:</strong><br />
                {formatDateTime(meeting.dateTime)}
              </div>
              
              <div style={{
                padding: '1rem',
                background: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e1e8ed'
              }}>
                <strong style={{ color: '#2c3e50' }}>With:</strong><br />
                {organizer.fullName} ({organizer.email})
              </div>
              
              {meeting.description && (
                <div style={{
                  padding: '1rem',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  border: '1px solid #e1e8ed'
                }}>
                  <strong style={{ color: '#2c3e50' }}>Description:</strong><br />
                  {meeting.description}
                </div>
              )}
              
              <div style={{
                padding: '1rem',
                background: '#e8f5e8',
                borderRadius: '6px',
                border: '1px solid #28a745'
              }}>
                <strong style={{ color: '#28a745' }}>Meeting Room:</strong><br />
                <code style={{ 
                  background: 'white', 
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}>
                  {meeting.roomId}
                </code>
              </div>
            </div>
          </div>

          {/* Meeting Link */}
          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '6px',
            padding: '1rem',
            marginBottom: '2rem'
          }}>
            <h4 style={{ color: '#856404', marginBottom: '0.5rem' }}>
              🔗 Meeting Link
            </h4>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
              Click this link when it's time for your meeting:
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={`${window.location.origin}/meeting/${meeting.roomId}`}
                readOnly
                style={{ 
                  flex: 1, 
                  fontSize: '0.9rem',
                  background: 'white'
                }}
              />
              <button 
                className="nav-btn secondary"
                onClick={copyMeetingLink}
              >
                📋 Copy
              </button>
            </div>
          </div>

          {/* Next Steps */}
          <div>
            <h3 style={{ color: '#2c3e50', marginBottom: '1rem' }}>
              📋 Next Steps
            </h3>
            <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
              <li>
                <strong>Check Your Email:</strong> You'll receive a confirmation email with calendar invite and meeting details within a few minutes.
              </li>
              <li>
                <strong>Add to Calendar:</strong> Save the meeting to your calendar using the ICS file attachment in the email.
              </li>
              <li>
                <strong>Test Your Setup:</strong> Ensure your camera and microphone are working before the meeting.
              </li>
              <li>
                <strong>Join on Time:</strong> Click the meeting link above at the scheduled time.
              </li>
            </ul>
          </div>
        </div>

        {/* Technical Requirements */}
        <div className="card">
          <h3 style={{ color: '#2c3e50', marginBottom: '1rem' }}>
            🔧 Technical Requirements
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <h4 style={{ color: '#667eea', marginBottom: '0.5rem' }}>
                🌐 Browser
              </h4>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>
                Chrome, Firefox, Safari, or Edge (latest versions)
              </p>
            </div>
            <div>
              <h4 style={{ color: '#667eea', marginBottom: '0.5rem' }}>
                📹 Camera
              </h4>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>
                Built-in or external webcam
              </p>
            </div>
            <div>
              <h4 style={{ color: '#667eea', marginBottom: '0.5rem' }}>
                🎤 Microphone
              </h4>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>
                Built-in mic or headset recommended
              </p>
            </div>
            <div>
              <h4 style={{ color: '#667eea', marginBottom: '0.5rem' }}>
                📶 Internet
              </h4>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>
                Stable broadband connection
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="card">
          <h3 style={{ color: '#2c3e50', marginBottom: '1rem' }}>
            📞 Need to Reschedule?
          </h3>
          <p style={{ marginBottom: '1rem' }}>
            If you need to reschedule or cancel this meeting, please contact:
          </p>
          <div style={{
            background: '#f8f9fa',
            padding: '1rem',
            borderRadius: '6px',
            border: '1px solid #e1e8ed',
            marginBottom: '2rem'
          }}>
            <strong>{organizer.fullName}</strong><br />
            <a href={`mailto:${organizer.email}`} style={{ color: '#667eea' }}>
              {organizer.email}
            </a>
          </div>
          
          <button 
            className="nav-btn primary"
            onClick={() => navigate('/')}
            style={{ width: '100%' }}
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;