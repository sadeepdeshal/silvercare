import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HealthProfessionalDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in and has the right role
    const token = localStorage.getItem('silvercare_token');
    const userRole = localStorage.getItem('silvercare_role');
    const userData = localStorage.getItem('silvercare_user');

    if (!token || userRole !== 'healthprofessional') {
      navigate('/login');
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('silvercare_token');
    localStorage.removeItem('silvercare_role');
    localStorage.removeItem('silvercare_user');
    navigate('/login');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        borderBottom: '1px solid #eee',
        paddingBottom: '20px'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#2c3e50' }}>
            Welcome, {user.name}
          </h1>
          <p style={{ margin: '5px 0 0 0', color: '#7f8c8d' }}>
            Health Professional Dashboard
          </p>
        </div>
        <button 
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          backgroundColor: '#3498db',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Account Status</h3>
          <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
            {user.status === 'confirmed' ? 'Active' : 'Pending Approval'}
          </p>
        </div>

        <div style={{
          backgroundColor: '#2ecc71',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Role</h3>
          <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
            Health Professional
          </p>
        </div>

        <div style={{
          backgroundColor: '#9b59b6',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Email</h3>
          <p style={{ margin: 0, fontSize: '16px' }}>
            {user.email}
          </p>
        </div>
      </div>

      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h2 style={{ marginTop: 0, color: '#2c3e50' }}>Dashboard Features</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '15px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '5px',
            border: '1px solid #ddd',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#34495e' }}>Patient Management</h4>
            <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>
              Manage your patients and their mental health records
            </p>
          </div>

           <div style={{
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '5px',
            border: '1px solid #ddd',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#34495e' }}>Appointments</h4>
            <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>
              Schedule and manage therapy sessions
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '5px',
            border: '1px solid #ddd',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#34495e' }}>Treatment Plans</h4>
            <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>
              Create and monitor treatment plans for seniors
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '5px',
            border: '1px solid #ddd',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#34495e' }}>Reports</h4>
            <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>
              Generate progress reports and assessments
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '5px',
            border: '1px solid #ddd',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#34495e' }}>Profile Settings</h4>
            <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>
              Update your professional information and credentials
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '5px',
            border: '1px solid #ddd',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#34495e' }}>Resources</h4>
            <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>
              Access mental health resources and guidelines
            </p>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>Getting Started</h3>
        <p style={{ margin: 0, color: '#856404' }}>
          Welcome to SilverCare! Your account is now active and you can start providing mental health services to seniors and their families. 
          Use the dashboard features above to manage your practice effectively.
        </p>
      </div>
    </div>
  );
};

export default HealthProfessionalDashboard;

