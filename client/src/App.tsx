import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthDebugPanel from './components/AuthDebugPanel';

// Page imports
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Meeting from './pages/Meeting';
import Booking from './pages/Booking';
import Admin from './pages/Admin';
import Settings from './pages/Settings';

// Notification Toast Component
const NotificationToast: React.FC = () => {
  return (
    <div id="notification-container" style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999
    }}>
      {/* Notification toasts will be dynamically inserted here */}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <div className="App">
      <AuthProvider>
        <NotificationProvider>
          <Router future={{ 
            v7_startTransition: true,
            v7_relativeSplatPath: true 
          }}>
            <div style={{ minHeight: '100vh' }}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                
                {/* Protected Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Navigate to="/dashboard" replace />
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/calendar" element={
                  <ProtectedRoute>
                    <Calendar />
                  </ProtectedRoute>
                } />
                
                <Route path="/meeting/:meetingId?" element={
                  <ProtectedRoute>
                    <Meeting />
                  </ProtectedRoute>
                } />
                
                <Route path="/booking" element={
                  <ProtectedRoute>
                    <Booking />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin" element={
                  <ProtectedRoute adminOnly>
                    <Admin />
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                
                {/* Catch-all route */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
              
              {/* Notification System */}
              <NotificationToast />
              
              {/* Auth Debug Panel (only visible for admin users) */}
              <AuthDebugPanel />
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </div>
  );
};

export default App;