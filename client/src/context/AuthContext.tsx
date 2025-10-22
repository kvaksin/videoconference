import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await authService.verifyAuth();
        if (response.authenticated && response.user) {
          setCurrentUser(response.user);
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const user = await authService.login(email, password);
      setCurrentUser(user);
    } catch (error) {
      throw error;
    }
  };

  const signup = async (fullName: string, email: string, password: string): Promise<void> => {
    try {
      const user = await authService.signup(fullName, email, password);
      setCurrentUser(user);
    } catch (error) {
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      setCurrentUser(null);
    } catch (error) {
      throw error;
    }
  };

  const updateUser = (user: User): void => {
    setCurrentUser(user);
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};