"use client";

import React, { createContext, useContext, useState } from "react";

interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (type: Notification["type"], message: string) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentMessages, setRecentMessages] = useState<Set<string>>(new Set()); 

  const MAX_NOTIFICATIONS = 2; 

  const addNotification = (type: Notification["type"], message: string) => {
    if (recentMessages.has(message)) return;

    const id = new Date().toISOString();
    setNotifications((prev) => {
      const newNotifications = [...prev, { id, type, message }];
      if (newNotifications.length > MAX_NOTIFICATIONS) {
        newNotifications.shift(); 
      }
      return newNotifications;
    });


    setRecentMessages((prev) => new Set(prev).add(message));
    setTimeout(() => {
      setRecentMessages((prev) => {
        const newMessages = new Set(prev);
        newMessages.delete(message);
        return newMessages;
      });
    }, 3000); 

    setTimeout(() => {
      removeNotification(id);
    }, 5000); 
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};
