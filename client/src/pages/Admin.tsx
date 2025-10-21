import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { fetchAPI } from '../services/api';
import { User, Meeting } from '../types';

interface NewUserForm {
  fullName: string;
  email: string;
  password: string;
  hasFullLicense: boolean;
  isAdmin: boolean;
}

type AdminTab = 'users' | 'meetings';

const Admin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTab, setSelectedTab] = useState<AdminTab>('users');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<NewUserForm>({
    fullName: '',
    email: '',
    password: '',
    hasFullLicense: false,
    isAdmin: false
  });
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  
  const { currentUser } = useAuth();
  const { success, error } = useNotification();
  const navigate = useNavigate();

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const [usersData, meetingsData] = await Promise.all([
        fetchAPI<User[]>('/api/admin/users'),
        fetchAPI<Meeting[]>('/api/admin/meetings')
      ]);
      
      setUsers(usersData || []);
      setMeetings(meetingsData || []);
    } catch (err) {
      error('Failed to load admin data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    if (!currentUser?.isAdmin && currentUser?.role !== 'admin') {
      error('Administrator access required');
      navigate('/dashboard');
      return;
    }
    
    loadData();
  }, [currentUser, navigate, loadData, error]);

  const createUser = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    try {
      await fetchAPI('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      
      success('User created successfully');
      setShowAddForm(false);
      setNewUser({
        fullName: '',
        email: '',
        password: '',
        hasFullLicense: false,
        isAdmin: false
      });
      await loadData();
    } catch (err) {
      error('Failed to create user');
      console.error(err);
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
      await fetchAPI(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      success('User updated successfully');
      setEditingUser(null);
      await loadData();
    } catch (err) {
      error('Failed to update user');
      console.error(err);
    }
  };

  const deleteUser = async (userId: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      await fetchAPI(`/api/admin/users/${userId}`, { method: 'DELETE' });
      success('User deleted successfully');
      await loadData();
    } catch (err) {
      error('Failed to delete user');
      console.error(err);
    }
  };

  const deleteMeeting = async (meetingId: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) {
      return;
    }
    
    try {
      await fetchAPI(`/api/admin/meetings/${meetingId}`, { method: 'DELETE' });
      success('Meeting deleted successfully');
      await loadData();
    } catch (err) {
      error('Failed to delete meeting');
      console.error(err);
    }
  };

  const formatDateTime = (dateTime: string): string => {
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleNewUserChange = (field: keyof NewUserForm, value: string | boolean): void => {
    setNewUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditingUserChange = (field: keyof User, value: boolean): void => {
    if (editingUser) {
      setEditingUser(prev => ({
        ...prev!,
        [field]: value
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="text-center" style={{ padding: '3rem' }}>
          <div className="spinner"></div>
          <p>Loading admin panel...</p>
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
            ⚙️ Admin Panel
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            Manage users and system settings
          </p>
        </div>
        <button 
          className="nav-btn secondary"
          onClick={() => navigate('/dashboard')}
        >
          ← Back to Dashboard
        </button>
      </header>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        borderBottom: '2px solid #e1e8ed'
      }}>
        <button 
          className={`tab-btn ${selectedTab === 'users' ? 'active' : ''}`}
          onClick={() => setSelectedTab('users')}
          style={{
            padding: '1rem 2rem',
            border: 'none',
            background: selectedTab === 'users' ? '#667eea' : 'transparent',
            color: selectedTab === 'users' ? 'white' : '#666',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          👥 Users ({users.length})
        </button>
        <button 
          className={`tab-btn ${selectedTab === 'meetings' ? 'active' : ''}`}
          onClick={() => setSelectedTab('meetings')}
          style={{
            padding: '1rem 2rem',
            border: 'none',
            background: selectedTab === 'meetings' ? '#667eea' : 'transparent',
            color: selectedTab === 'meetings' ? 'white' : '#666',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🎥 Meetings ({meetings.length})
        </button>
      </div>

      {/* Users Tab */}
      {selectedTab === 'users' && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <h2 style={{ color: '#2c3e50', margin: 0 }}>User Management</h2>
            <button 
              className="nav-btn primary"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? 'Cancel' : '+ Add User'}
            </button>
          </div>

          {showAddForm && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#2c3e50', marginBottom: '1rem' }}>Create New User</h3>
              <form onSubmit={createUser}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div className="form-group">
                    <label htmlFor="fullName">Full Name</label>
                    <input
                      type="text"
                      id="fullName"
                      value={newUser.fullName}
                      onChange={(e) => handleNewUserChange('fullName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      value={newUser.email}
                      onChange={(e) => handleNewUserChange('email', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      value={newUser.password}
                      onChange={(e) => handleNewUserChange('password', e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={newUser.hasFullLicense}
                      onChange={(e) => handleNewUserChange('hasFullLicense', e.target.checked)}
                    />
                    Full License
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={newUser.isAdmin}
                      onChange={(e) => handleNewUserChange('isAdmin', e.target.checked)}
                    />
                    Administrator
                  </label>
                </div>
                
                <button type="submit" className="nav-btn primary">
                  Create User
                </button>
              </form>
            </div>
          )}

          <div className="card">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e1e8ed' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>User</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>License</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Admin</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #e1e8ed' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 'bold' }}>{user.fullName || user.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>ID: {user.id}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>{user.email}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          backgroundColor: user.hasFullLicense ? '#d4edda' : '#fff3cd',
                          color: user.hasFullLicense ? '#155724' : '#856404'
                        }}>
                          {user.hasFullLicense ? 'Full' : 'Basic'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {(user.isAdmin || user.role === 'admin') ? '✅' : '❌'}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button 
                            className="nav-btn secondary"
                            onClick={() => setEditingUser(user)}
                            style={{ padding: '0.5rem', fontSize: '0.8rem' }}
                          >
                            Edit
                          </button>
                          {user.id !== currentUser?.id && (
                            <button 
                              className="nav-btn danger"
                              onClick={() => deleteUser(user.id)}
                              style={{ padding: '0.5rem', fontSize: '0.8rem' }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Meetings Tab */}
      {selectedTab === 'meetings' && (
        <div>
          <h2 style={{ color: '#2c3e50', marginBottom: '2rem' }}>Meeting Management</h2>
          
          <div className="card">
            {meetings.length === 0 ? (
              <div className="text-center" style={{ padding: '3rem', color: '#666' }}>
                <p>No meetings found.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e1e8ed' }}>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Meeting</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Date & Time</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Organizer</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Booked By</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meetings.map((meeting) => (
                      <tr key={meeting.id} style={{ borderBottom: '1px solid #e1e8ed' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 'bold' }}>{meeting.title || 'Video Meeting'}</div>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>
                            Room: {meeting.roomId}
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {formatDateTime(meeting.dateTime)}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {meeting.organizerName || 'N/A'}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div>{meeting.bookerName}</div>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>
                            {meeting.bookerEmail}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            backgroundColor: meeting.status === 'confirmed' ? '#d4edda' : '#fff3cd',
                            color: meeting.status === 'confirmed' ? '#155724' : '#856404'
                          }}>
                            {meeting.status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <button 
                            className="nav-btn danger"
                            onClick={() => deleteMeeting(meeting.id)}
                            style={{ padding: '0.5rem', fontSize: '0.8rem' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '1rem' }}>
              Edit User: {editingUser.fullName || editingUser.name}
            </h3>
            
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={editingUser.hasFullLicense || false}
                  onChange={(e) => handleEditingUserChange('hasFullLicense', e.target.checked)}
                />
                Full License
              </label>
              
              {editingUser.id !== currentUser?.id && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={editingUser.isAdmin || editingUser.role === 'admin'}
                    onChange={(e) => handleEditingUserChange('isAdmin', e.target.checked)}
                  />
                  Administrator
                </label>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="nav-btn primary"
                onClick={() => updateUser(editingUser.id, {
                  hasFullLicense: editingUser.hasFullLicense,
                  isAdmin: editingUser.isAdmin,
                  role: editingUser.isAdmin ? 'admin' : 'user'
                })}
                style={{ flex: 1 }}
              >
                Save Changes
              </button>
              <button 
                className="nav-btn secondary"
                onClick={() => setEditingUser(null)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;