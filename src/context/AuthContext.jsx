/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('adminUser');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);

  /**
   * Admin Login
   */
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.login(email, password);

      if (response.success) {
        const { token: newToken, user: userData } = response;

        // Store token
        apiService.setToken(newToken);
        setToken(newToken);

        // Store user data
        setUser(userData);
        localStorage.setItem('adminUser', JSON.stringify(userData));
        setIsAuthenticated(true);

        return {
          success: true,
          user: userData,
          token: newToken,
        };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (err) {
      const errorMessage = err.message || 'An error occurred during login';
      setError(errorMessage);
      setIsAuthenticated(false);

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout
   */
  const logout = () => {
    apiService.logout();
    setToken(null);
    setUser(null);
    localStorage.removeItem('adminUser');
    setIsAuthenticated(false);
    setError(null);
  };

  /**
   * Check if user is admin (optional role check)
   */
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  // Initialize auth state from stored token
  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    const storedUser = localStorage.getItem('adminUser');
    if (storedToken && !token) {
      apiService.setToken(storedToken);
      setToken(storedToken);
      setIsAuthenticated(true);
    }

    if (storedUser && !user) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('adminUser');
      }
    }
  }, []);

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
