import React from 'react';
import { useAuth } from '../../context/AuthContext'; //
import Navbar from '../../components/navbar';

const  AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  return (
    <div>
      
            <Navbar />
          <div>
      <h1>Welcome, {currentUser.name}!</h1>
      <p>Email: {currentUser.email}</p>
      <p>Role: {currentUser.role}</p>
      {/* Caregiver-specific content */}
      <button onClick={logout}>Logout</button>
    </div>
    </div>
  );
};

export default AdminDashboard;
