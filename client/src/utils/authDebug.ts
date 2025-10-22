import { tokenManager } from '../services/api';

// Debug utility to clear authentication state
export const clearAuthState = () => {
  // Clear token from localStorage
  tokenManager.removeToken();
  
  // Clear any session storage
  sessionStorage.clear();
  
  // Force page reload to reset React state
  window.location.reload();
};

// Check if user has a valid token
export const hasValidToken = (): boolean => {
  const token = tokenManager.getToken();
  if (!token) return false;
  
  try {
    // Basic JWT token structure check
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decode payload to check expiration
    const payload = JSON.parse(atob(parts[1]));
    const now = Date.now() / 1000;
    
    return payload.exp > now;
  } catch (error) {
    return false;
  }
};

export default { clearAuthState, hasValidToken };