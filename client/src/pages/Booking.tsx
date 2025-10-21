import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { fetchAPI } from '../services/api';
import { OrganizerInfo, AvailabilitySlot, BookingFormData, Meeting } from '../types';

const Booking: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { success, error } = useNotification();
  
  const [organizer, setOrganizer] = useState<OrganizerInfo | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingForm, setBookingForm] = useState<BookingFormData>({
    bookerName: '',
    bookerEmail: '',
    title: '',
    description: ''
  });

  const loadOrganizerData = useCallback(async (): Promise<void> => {
    if (!userId) {
      error('Invalid user ID');
      return;
    }

    try {
      setIsLoading(true);
      const [organizerData, availabilityData] = await Promise.all([
        fetchAPI<OrganizerInfo>(`/api/booking/${userId}/organizer`),
        fetchAPI<AvailabilitySlot[]>(`/api/booking/${userId}/availability`)
      ]);
      
      setOrganizer(organizerData);
      setAvailability(availabilityData || []);
    } catch (err) {
      error('Failed to load booking information');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, error]);

  useEffect(() => {
    loadOrganizerData();
  }, [loadOrganizerData]);

  const bookMeeting = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!selectedSlot) {
      error('Please select a time slot');
      return;
    }

    if (!userId) {
      error('Invalid organizer ID');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetchAPI<Meeting>('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizerId: userId,
          availabilityId: selectedSlot.id,
          ...bookingForm
        })
      });
      
      success('Meeting booked successfully! Check your email for details.');
      
      // Redirect to a success page or show meeting details
      setTimeout(() => {
        navigate('/booking-success', { 
          state: { 
            meeting: response,
            organizer: organizer 
          }
        });
      }, 1000);
      
    } catch (err) {
      error('Failed to book meeting. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
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

  const isSlotAvailable = (slot: AvailabilitySlot): boolean => {
    const slotDateTime = new Date(`${slot.date}T${slot.startTime}`);
    return slotDateTime > new Date();
  };

  const handleFormChange = (field: keyof BookingFormData, value: string): void => {
    setBookingForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="text-center" style={{ color: 'white' }}>
          <div className="spinner"></div>
          <p>Loading booking information...</p>
        </div>
      </div>
    );
  }

  if (!organizer) {
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
            ❌ Organizer Not Found
          </h2>
          <p style={{ marginBottom: '2rem' }}>
            The booking link you're trying to access is invalid or the organizer is not available for booking.
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

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem 1rem'
    }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        {/* Header */}
        <div className="card" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: '#667eea',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '2rem'
          }}>
            👤
          </div>
          <h1 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>
            Book a Meeting with {organizer.fullName}
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            Select an available time slot and provide your details
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '2rem'
        }}>
          {/* Available Time Slots */}
          <div className="card">
            <h2 style={{ color: '#2c3e50', marginBottom: '1.5rem' }}>
              📅 Available Time Slots
            </h2>

            {availability.length === 0 ? (
              <div className="text-center" style={{ padding: '3rem', color: '#666' }}>
                <p>No available time slots at the moment.</p>
                <p>Please contact {organizer.fullName} directly.</p>
              </div>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {availability
                  .filter(isSlotAvailable)
                  .map((slot) => (
                    <div 
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      style={{
                        padding: '1rem',
                        border: `2px solid ${selectedSlot?.id === slot.id ? '#667eea' : '#e1e8ed'}`,
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        cursor: 'pointer',
                        background: selectedSlot?.id === slot.id ? '#f0f4ff' : 'white',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ 
                        fontWeight: 'bold', 
                        marginBottom: '0.5rem',
                        color: selectedSlot?.id === slot.id ? '#667eea' : '#2c3e50'
                      }}>
                        {formatDate(slot.date)}
                      </div>
                      <div style={{ 
                        color: '#666', 
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span>🕒</span>
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </div>
                      {selectedSlot?.id === slot.id && (
                        <div style={{
                          marginTop: '0.5rem',
                          color: '#667eea',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}>
                          ✓ Selected
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Booking Form */}
          <div className="card">
            <h2 style={{ color: '#2c3e50', marginBottom: '1.5rem' }}>
              📝 Your Details
            </h2>

            <form onSubmit={bookMeeting}>
              <div className="form-group">
                <label htmlFor="bookerName">Full Name *</label>
                <input
                  type="text"
                  id="bookerName"
                  value={bookingForm.bookerName}
                  onChange={(e) => handleFormChange('bookerName', e.target.value)}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="bookerEmail">Email Address *</label>
                <input
                  type="email"
                  id="bookerEmail"
                  value={bookingForm.bookerEmail}
                  onChange={(e) => handleFormChange('bookerEmail', e.target.value)}
                  required
                  placeholder="Enter your email address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="title">Meeting Title</label>
                <input
                  type="text"
                  id="title"
                  value={bookingForm.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  placeholder="Brief meeting title (optional)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Meeting Description</label>
                <textarea
                  id="description"
                  value={bookingForm.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="What would you like to discuss? (optional)"
                  rows={4}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {selectedSlot && (
                <div style={{
                  background: '#f0f4ff',
                  border: '1px solid #667eea',
                  borderRadius: '6px',
                  padding: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <h4 style={{ color: '#667eea', marginBottom: '0.5rem' }}>
                    📅 Selected Time Slot
                  </h4>
                  <div style={{ color: '#2c3e50' }}>
                    <strong>{formatDate(selectedSlot.date)}</strong><br />
                    {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                className="nav-btn primary"
                disabled={isSubmitting || !selectedSlot}
                style={{ 
                  width: '100%',
                  opacity: (!selectedSlot || isSubmitting) ? 0.6 : 1
                }}
              >
                {isSubmitting ? 'Booking...' : 'Book Meeting'}
              </button>

              {!selectedSlot && (
                <p style={{ 
                  color: '#dc3545', 
                  fontSize: '0.9rem', 
                  marginTop: '0.5rem',
                  textAlign: 'center'
                }}>
                  Please select a time slot to continue
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Meeting Information */}
        <div className="card">
          <h2 style={{ color: '#2c3e50', marginBottom: '1.5rem' }}>
            ℹ️ Meeting Information
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem'
          }}>
            <div>
              <h4 style={{ color: '#667eea', marginBottom: '0.5rem' }}>
                📹 Video Conference
              </h4>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.4', margin: 0 }}>
                The meeting will be conducted via video conference. You'll receive a meeting link in your confirmation email.
              </p>
            </div>
            
            <div>
              <h4 style={{ color: '#667eea', marginBottom: '0.5rem' }}>
                📧 Confirmation
              </h4>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.4', margin: 0 }}>
                You'll receive an email confirmation with meeting details and calendar invite within a few minutes.
              </p>
            </div>
            
            <div>
              <h4 style={{ color: '#667eea', marginBottom: '0.5rem' }}>
                🔧 Technical Requirements
              </h4>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.4', margin: 0 }}>
                Ensure you have a stable internet connection and access to a camera and microphone.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="card">
          <h2 style={{ color: '#2c3e50', marginBottom: '1.5rem' }}>
            📞 Need Help?
          </h2>
          <p style={{ marginBottom: '1rem' }}>
            If you have any questions or need to reschedule, please contact:
          </p>
          <div style={{
            background: '#f8f9fa',
            padding: '1rem',
            borderRadius: '6px',
            border: '1px solid #e1e8ed'
          }}>
            <strong>{organizer.fullName}</strong><br />
            <a href={`mailto:${organizer.email}`} style={{ color: '#667eea' }}>
              {organizer.email}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;