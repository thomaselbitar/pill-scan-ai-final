import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const username = await AsyncStorage.getItem('username');
      const userId = await AsyncStorage.getItem('userId');
      if (username && userId) {
        setUser({ username, userId });
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await authAPI.login(username, password);
      const userData = {
        username: response.username,
        userId: response.user_id,
      };
      
      // Save to storage
      await AsyncStorage.setItem('username', userData.username);
      await AsyncStorage.setItem('userId', userData.userId);
      
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (username, password) => {
    try {
      const response = await authAPI.register(username, password);
      const userData = {
        username: response.username,
        userId: response.user_id,
      };
      
      // Save to storage
      await AsyncStorage.setItem('username', userData.username);
      await AsyncStorage.setItem('userId', userData.userId);
      
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('username');
      await AsyncStorage.removeItem('userId');
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

