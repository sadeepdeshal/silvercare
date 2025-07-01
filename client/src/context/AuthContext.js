import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data on app load - USE SAME KEY AS DASHBOARD
    const storedUser = localStorage.getItem('silvercare_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setCurrentUser(userData);
    // Store with the SAME KEYS your dashboard expects
    localStorage.setItem('silvercare_user', JSON.stringify(userData));
    localStorage.setItem('silvercare_token', userData.token || 'dummy-token');
    localStorage.setItem('silvercare_role', userData.role);
  };

  const logout = () => {
    setCurrentUser(null);
    // Remove the SAME KEYS
    localStorage.removeItem('silvercare_user');
    localStorage.removeItem('silvercare_token');
    localStorage.removeItem('silvercare_role');
  };

  const value = {
    currentUser,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
