import React from 'react';
import Navbar from '../../components/navbar';
import styles from "../../components/css/navbar.module.css";
import { useAuth } from '../../context/AuthContext';

const CaregiverProfile = () => {
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
      <div style={{
        padding: '40px',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f8f9fa',
        minHeight: '100vh',
        paddingTop: '120px' // Added extra padding to account for fixed navbar
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{
            color: '#2c3e50',
            fontSize: '2.5rem',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            Welcome to Your Caregiver Dashboard
          </h1>
          
          <p style={{
            color: '#7f8c8d',
            fontSize: '1.2rem',
            textAlign: 'center',
            marginBottom: '40px'
          }}>
            Manage your caregiving services and connect with families in need
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginTop: '40px'
          }}>
            <div style={{
              backgroundColor: '#e8f5e8',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #c3e6c3'
            }}>
              <h3 style={{ color: '#27ae60', marginBottom: '12px' }}>My Profile</h3>
              <p style={{ color: '#2c3e50', fontSize: '14px' }}>
                Manage your professional profile and credentials
              </p>
            </div>

            <div style={{
              backgroundColor: '#e8f4fd',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #b3d9f7'
            }}>
              <h3 style={{ color: '#3498db', marginBottom: '12px' }}>Available Jobs</h3>
              <p style={{ color: '#2c3e50', fontSize: '14px' }}>
                Browse and apply for caregiving opportunities
              </p>
            </div>

            <div style={{
              backgroundColor: '#fff3cd',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #ffeaa7'
            }}>
              <h3 style={{ color: '#f39c12', marginBottom: '12px' }}>My Clients</h3>
              <p style={{ color: '#2c3e50', fontSize: '14px' }}>
                View and manage your current client relationships
              </p>
            </div>

            <div style={{
              backgroundColor: '#fde8e8',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #fab1a0'
            }}>
              <h3 style={{ color: '#e74c3c', marginBottom: '12px' }}>Schedule</h3>
              <p style={{ color: '#2c3e50', fontSize: '14px' }}>
                Manage your appointments and availability
              </p>
            </div>
          </div>

          <div style={{
            marginTop: '40px',
            padding: '24px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '12px' }}>
              🎉 Registration Successful!
            </h3>
            <p style={{ color: '#7f8c8d' }}>
              Your caregiver account has been created successfully. 
              Start exploring the platform and connect with families who need your care.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaregiverProfile;
