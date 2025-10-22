import React from 'react';
import { useAuth } from '../context/AuthContext';
import { tokenManager } from '../services/api';
import { clearAuthState, hasValidToken } from '../utils/authDebug';

const AuthDebugPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const token = tokenManager.getToken();
  const isTokenValid = hasValidToken();

  if (!currentUser?.isAdmin) {
    return null; // Only show for admin users
  }

  const handleClearAuth = () => {
    if (window.confirm('This will log you out and clear all authentication data. Continue?')) {
      clearAuthState();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#fff3cd',
      border: '1px solid #ffeaa7',
      borderRadius: '4px',
      padding: '10px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
        🔧 Auth Debug Panel
      </div>
      <div>User: {currentUser.email}</div>
      <div>Admin: {currentUser.isAdmin ? '✅' : '❌'}</div>
      <div>Token: {token ? '✅' : '❌'}</div>
      <div>Token Valid: {isTokenValid ? '✅' : '❌'}</div>
      
      {(!token || !isTokenValid) && (
        <div style={{ marginTop: '10px' }}>
          <div style={{ color: '#d63031', fontWeight: 'bold', marginBottom: '5px' }}>
            ⚠️ Authentication Issue Detected
          </div>
          <div style={{ marginBottom: '10px', fontSize: '11px' }}>
            Missing or invalid JWT token. Admin features may not work.
          </div>
          <button 
            onClick={handleClearAuth}
            style={{
              background: '#0984e3',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Fix: Logout & Re-login
          </button>
        </div>
      )}
    </div>
  );
};

export default AuthDebugPanel;