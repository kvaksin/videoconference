import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { ProtectedRouteProps } from '../types';

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  adminOnly = false,
  requireAdmin = false, 
  requireFullLicense = false 
}) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (adminOnly || requireAdmin) {
    if (!currentUser.isAdmin) {
      return <Navigate to="/dashboard" />;
    }
  }

  if (requireFullLicense && !currentUser.hasFullLicense) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;