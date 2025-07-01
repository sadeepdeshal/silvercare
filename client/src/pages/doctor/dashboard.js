import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/navbar';
import styles from "../../components/css/navbar.module.css";
const DoctorDashboard = () => {
    const { currentUser, logout } = useAuth();
  return (
    <div>
       <Navbar />
      <h1>Hi</h1>
            <h1>Welcome, {currentUser.name}!</h1>
      <p>Email: {currentUser.email}</p>
      <p>Role: {currentUser.role}</p>
      {/* Caregiver-specific content */}
      <button onClick={logout}>Logout</button>
      <p>This is the Doctor Dashboard - Testing Purpose</p>
    </div>
  );
};

export default  DoctorDashboard;
