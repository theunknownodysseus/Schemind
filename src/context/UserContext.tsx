import React, { createContext, useContext, useState, useEffect } from 'react';

type UserProfile = {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  notificationPreferences?: {
    enabled: boolean;
    time?: string;
    message?: string;
  };
  currentTopic?: string;
  streak: number;
  totalStudyTime: number;
  lastStudyDate: string;
  avatar: string;
};

type UserContextType = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, phoneNumber?: string) => Promise<void>;
  updateNotificationPreferences: (preferences: { enabled: boolean; time?: string; message?: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Check for stored user data on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Here you would typically make an API call to your backend
      // For now, we'll simulate a successful login
      const mockUser: UserProfile = {
        id: '1',
        name: 'John Doe',
        email,
        streak: 5,
        totalStudyTime: 120,
        lastStudyDate: new Date().toISOString(),
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
      };
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string, phoneNumber?: string) => {
    try {
      const mockUser: UserProfile = {
        id: '1',
        name,
        email,
        phoneNumber,
        notificationPreferences: {
          enabled: false
        },
        streak: 0,
        totalStudyTime: 0,
        lastStudyDate: new Date().toISOString(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
      };
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    
    try {
      // Here you would typically make an API call to your backend
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };

  const updateNotificationPreferences = async (preferences: { enabled: boolean; time?: string; message?: string }) => {
    if (!user) return;
    
    try {
      const updatedUser = {
        ...user,
        notificationPreferences: preferences
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
      updateProfile,
      updateNotificationPreferences
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 