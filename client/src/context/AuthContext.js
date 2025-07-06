import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // ✅ Now this will work because AuthProvider is inside Router

  useEffect(() => {
    // Check localStorage on app start
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('silvercare_token');
    const userData = localStorage.getItem('silvercare_user');
    
    if (token && userData) {
      setCurrentUser(JSON.parse(userData));
    } else {
      setCurrentUser(null);
    }
    setLoading(false);
  };

  const login = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('silvercare_token', userData.token);
    localStorage.setItem('silvercare_user', JSON.stringify(userData));
    localStorage.setItem('silvercare_role', userData.role);
  };

const logout = () => {
  // ✅ Complete logout
  setCurrentUser(null); // Clear state immediately
  
  // Clear all localStorage
  localStorage.removeItem('silvercare_token');
  localStorage.removeItem('silvercare_user');
  localStorage.removeItem('silvercare_role');
  localStorage.clear(); // Clear everything to be safe
  
  // Force redirect to login
  navigate('/login', { replace: true });
  
  // Optional: Reload page to clear any cached data
  window.location.reload();
};


  return (
    <AuthContext.Provider value={{
      currentUser,
      user: currentUser, // Add this alias for compatibility
      isAuthenticated: !!currentUser,
      login,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
