import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ChangePassword from '../components/ChangePassword';
import './Settings.css';

type SettingsTab = 'profile' | 'security' | 'preferences';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const { currentUser } = useAuth();

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' }
  ];

  const renderTabContent = (): React.ReactElement => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="settings-content">
            <h3>Profile Information</h3>
            <div className="profile-info">
              <div className="info-item">
                <label>Full Name</label>
                <div className="info-value">{currentUser?.fullName || currentUser?.name}</div>
              </div>
              <div className="info-item">
                <label>Email Address</label>
                <div className="info-value">{currentUser?.email}</div>
              </div>
              <div className="info-item">
                <label>Account Type</label>
                <div className="info-value">
                  <span className={`license-badge ${currentUser?.hasFullLicense ? 'full' : 'basic'}`}>
                    {currentUser?.hasFullLicense ? 'Full License' : 'Basic License'}
                  </span>
                </div>
              </div>
              {(currentUser?.isAdmin || currentUser?.role === 'admin') && (
                <div className="info-item">
                  <label>Role</label>
                  <div className="info-value">
                    <span className="role-badge admin">Administrator</span>
                  </div>
                </div>
              )}
              <div className="info-item">
                <label>Member Since</label>
                <div className="info-value">
                  {currentUser?.createdAt ? 
                    new Date(currentUser.createdAt).toLocaleDateString() : 
                    'N/A'
                  }
                </div>
              </div>
            </div>
            
            {!currentUser?.hasFullLicense && (
              <div className="upgrade-notice">
                <h4>🎯 Upgrade to Full License</h4>
                <p>Unlock additional features including:</p>
                <ul>
                  <li>📅 Calendar integration</li>
                  <li>📝 Meeting scheduling</li>
                  <li>⏰ Availability management</li>
                  <li>📤 ICS file exports</li>
                  <li>📊 Advanced analytics</li>
                </ul>
                <p className="contact-admin">Contact your administrator to upgrade your account.</p>
              </div>
            )}
          </div>
        );

      case 'security':
        return (
          <div className="settings-content">
            <h3>Security Settings</h3>
            <div className="security-section">
              <h4>Password Management</h4>
              <p>Keep your account secure by regularly updating your password.</p>
              <ChangePassword />
            </div>
            
            <div className="security-section">
              <h4>Account Security Tips</h4>
              <div className="security-tips-grid">
                <div className="tip-card">
                  <div className="tip-icon">🔑</div>
                  <h5>Strong Passwords</h5>
                  <p>Use a unique password with at least 8 characters, including letters, numbers, and symbols.</p>
                </div>
                <div className="tip-card">
                  <div className="tip-icon">🔄</div>
                  <h5>Regular Updates</h5>
                  <p>Change your password every 3-6 months or if you suspect it may be compromised.</p>
                </div>
                <div className="tip-card">
                  <div className="tip-icon">🛡️</div>
                  <h5>Password Managers</h5>
                  <p>Consider using a password manager to generate and store secure passwords safely.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="settings-content">
            <h3>Preferences</h3>
            <div className="preferences-section">
              <h4>Video Conference Settings</h4>
              <div className="preference-item">
                <label>Default Video Quality</label>
                <select className="preference-select">
                  <option value="auto">Auto (Recommended)</option>
                  <option value="hd">HD (720p)</option>
                  <option value="sd">SD (480p)</option>
                </select>
              </div>
              
              <div className="preference-item">
                <label>Default Audio Settings</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>Join with microphone muted</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    <span>Enable noise suppression</span>
                  </label>
                </div>
              </div>

              <div className="preference-item">
                <label>Timezone</label>
                <select className="preference-select">
                  <option value="auto">Auto-detect</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>
            </div>

            <div className="preferences-section">
              <h4>Notification Settings</h4>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  <span>Email notifications for meeting invites</span>
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  <span>Browser notifications during meetings</span>
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Weekly meeting summary emails</span>
                </label>
              </div>
            </div>

            <div className="save-preferences">
              <button className="save-btn">Save Preferences</button>
              <button className="reset-btn">Reset to Defaults</button>
            </div>
          </div>
        );

      default:
        return <div>Tab content not found</div>;
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your account, security, and preferences</p>
      </div>

      <div className="settings-layout">
        <div className="settings-sidebar">
          <nav className="settings-nav">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="settings-main">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;