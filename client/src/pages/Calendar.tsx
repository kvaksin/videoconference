import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { fetchAPI } from '../services/api';
import { AvailabilitySlot, Meeting, AvailabilityFormData } from '../types';

const Calendar: React.FC = () => {
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [newAvailability, setNewAvailability] = useState<AvailabilityFormData>({
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00'
  });
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  
  const { currentUser } = useAuth();
  const { success, error } = useNotification();
  const navigate = useNavigate();

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const [availabilityData, meetingsData] = await Promise.all([
        fetchAPI<AvailabilitySlot[]>('/api/availability'),
        fetchAPI<Meeting[]>('/api/meetings')
      ]);
      
      setAvailability(availabilityData || []);
      setMeetings(meetingsData || []);
    } catch (err) {
      error('Failed to load calendar data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    if (!currentUser?.hasFullLicense) {
      error('Full license required for calendar access');
      navigate('/dashboard');
      return;
    }
    
    loadData();
  }, [currentUser, navigate, loadData, error]);

  const addAvailability = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    try {
      await fetchAPI('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAvailability)
      });
      
      success('Availability added successfully');
      setShowAddForm(false);
      setNewAvailability({
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00'
      });
      await loadData();
    } catch (err) {
      error('Failed to add availability');
      console.error(err);
    }
  };

  const deleteAvailability = async (id: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this availability?')) {
      return;
    }
    
    try {
      await fetchAPI(`/api/availability/${id}`, { method: 'DELETE' });
      success('Availability deleted successfully');
      await loadData();
    } catch (err) {
      error('Failed to delete availability');
      console.error(err);
    }
  };

  const exportToICS = async (): Promise<void> => {
    try {
      const response = await fetch('/api/meetings/export');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'calendar.ics';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      success('Calendar exported successfully');
    } catch (err) {
      error('Failed to export calendar');
      console.error(err);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string): string => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleAvailabilityChange = (field: keyof AvailabilityFormData, value: string): void => {
    setNewAvailability(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const copyBookingLink = async (): Promise<void> => {
    try {
      const link = `${window.location.origin}/book/${currentUser?.id}`;
      await navigator.clipboard.writeText(link);
      success('Booking link copied to clipboard');
    } catch (err) {
      error('Failed to copy link');
    }
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="text-center" style={{ padding: '3rem' }}>
          <div className="spinner"></div>
          <p>Loading calendar...</p>
        </div>
      </div>
    );
  }

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
            📅 Calendar
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            Manage your availability and meetings
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            className="nav-btn secondary"
            onClick={exportToICS}
          >
            📥 Export ICS
          </button>
          <button 
            className="nav-btn secondary"
            onClick={() => navigate('/dashboard')}
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '2rem'
      }}>
        {/* Availability Management */}
        <div className="card">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{ color: '#2c3e50', margin: 0 }}>
              🕒 Availability
            </h2>
            <button 
              className="nav-btn primary"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? 'Cancel' : '+ Add'}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={addAvailability} style={{ marginBottom: '2rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div className="form-group">
                  <label htmlFor="date">Date</label>
                  <input
                    type="date"
                    id="date"
                    value={newAvailability.date}
                    onChange={(e) => handleAvailabilityChange('date', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="startTime">Start Time</label>
                  <input
                    type="time"
                    id="startTime"
                    value={newAvailability.startTime}
                    onChange={(e) => handleAvailabilityChange('startTime', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="endTime">End Time</label>
                  <input
                    type="time"
                    id="endTime"
                    value={newAvailability.endTime}
                    onChange={(e) => handleAvailabilityChange('endTime', e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="nav-btn primary" style={{ width: '100%' }}>
                Add Availability
              </button>
            </form>
          )}

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {availability.length === 0 ? (
              <div className="text-center" style={{ padding: '2rem', color: '#666' }}>
                <p>No availability set. Add your available time slots.</p>
              </div>
            ) : (
              availability.map((slot) => (
                <div 
                  key={slot.id}
                  style={{
                    padding: '1rem',
                    border: '1px solid #e1e8ed',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      {formatDate(slot.date)}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </div>
                  </div>
                  <button 
                    className="nav-btn danger"
                    onClick={() => deleteAvailability(slot.id)}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Meetings */}
        <div className="card">
          <h2 style={{ color: '#2c3e50', marginBottom: '1.5rem' }}>
            🎥 Upcoming Meetings
          </h2>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {meetings.length === 0 ? (
              <div className="text-center" style={{ padding: '2rem', color: '#666' }}>
                <p>No meetings scheduled.</p>
              </div>
            ) : (
              meetings
                .filter(meeting => new Date(meeting.dateTime) >= new Date())
                .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
                .map((meeting) => (
                  <div 
                    key={meeting.id}
                    style={{
                      padding: '1rem',
                      border: '1px solid #e1e8ed',
                      borderRadius: '8px',
                      marginBottom: '1rem'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ fontWeight: 'bold' }}>
                        {meeting.title || 'Video Meeting'}
                      </div>
                      <span style={{
                        fontSize: '0.8rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: meeting.status === 'confirmed' ? '#d4edda' : '#fff3cd',
                        color: meeting.status === 'confirmed' ? '#155724' : '#856404',
                        borderRadius: '4px'
                      }}>
                        {meeting.status}
                      </span>
                    </div>
                    
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      📅 {formatDate(meeting.dateTime.split('T')[0])} at {formatTime(meeting.dateTime.split('T')[1])}
                    </div>
                    
                    {meeting.description && (
                      <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        {meeting.description}
                      </div>
                    )}
                    
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                      👤 Booked by: {meeting.bookerName} ({meeting.bookerEmail})
                    </div>
                    
                    <button 
                      className="nav-btn primary"
                      onClick={() => navigate(`/meeting/${meeting.roomId}`)}
                      style={{ width: '100%' }}
                    >
                      Join Meeting
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Public Booking Link */}
      <div className="card">
        <h2 style={{ color: '#2c3e50', marginBottom: '1.5rem' }}>
          🔗 Public Booking Link
        </h2>
        
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          Share this link with others so they can book meetings with you:
        </p>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={`${window.location.origin}/book/${currentUser?.id}`}
            readOnly
            style={{ flex: 1, fontSize: '0.9rem' }}
          />
          <button 
            className="nav-btn secondary"
            onClick={copyBookingLink}
          >
            📋 Copy
          </button>
        </div>
      </div>
    </div>
  );
};

export default Calendar;