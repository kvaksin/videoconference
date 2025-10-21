import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Notification, NotificationContextType, NotificationType } from '../types';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: number): void => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const addNotification = useCallback((message: string, type: NotificationType = 'info'): number => {
    const id = Date.now();
    const notification: Notification = { id, message, type };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto remove after 5 seconds
    setTimeout(() => removeNotification(id), 5000);
    
    return id;
  }, [removeNotification]);

  const success = useCallback((message: string): number => {
    return addNotification(message, 'success');
  }, [addNotification]);

  const error = useCallback((message: string): number => {
    return addNotification(message, 'error');
  }, [addNotification]);

  const warning = useCallback((message: string): number => {
    return addNotification(message, 'warning');
  }, [addNotification]);

  const info = useCallback((message: string): number => {
    return addNotification(message, 'info');
  }, [addNotification]);

  const value: NotificationContextType = {
    notifications,
    success,
    error,
    warning,
    info,
    removeNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};