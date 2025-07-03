import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/navbar';

const FamilyMemberDashboard = () => {
  const { currentUser, logout, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Protect the dashboard route
  useEffect(() => {
    if (loading) return; // Wait for auth to load

    if (!isAuthenticated || !currentUser) {
      navigate('/login', { replace: true });
      return;
    }

    if (currentUser.role !== 'family_member') {
      navigate('/login', { replace: true });
      return;
    }
  }, [currentUser, isAuthenticated, loading, navigate]);

  const handleElderRegistration = () => {
    navigate('/family-member/elder-signup');
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading...</h2>
        <p>Checking authentication...</p>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !currentUser || currentUser.role !== 'family_member') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div>
        <h1>Welcome, {currentUser.name}!</h1>
        <p>Email: {currentUser.email}</p>
        <p>Role: {currentUser.role}</p>
        
        {/* Elder Registration Button */}
        <div style={{ margin: '20px 0' }}>
          <button 
            onClick={handleElderRegistration}
            style={{
              backgroundColor: '#4facfe',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              borderRadius: '8px',
              cursor: 'pointer',
              marginRight: '10px',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#00f2fe';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#4facfe';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Register Your Elder
          </button>
        </div>

        <button onClick={logout}>Logout</button>
      </div>
    </div>
  );
};

export default FamilyMemberDashboard;
