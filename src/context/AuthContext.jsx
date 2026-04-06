/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState({ username: 'Test Admin' });

  const login = (username) => {
    setUser({ username: username || 'Admin User' });
  };

  const logout = () => {
    setUser({ username: 'Test Admin' });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
