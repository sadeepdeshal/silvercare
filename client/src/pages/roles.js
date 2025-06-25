import React from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import commonReg from "../components/images/roles.png";
import rolesImage from "../components/images/roles.png";
import "../components/css/roles.css";

export const Roles = () => {
  const navigate = useNavigate();

  const handleCaregiverClick = () => {
    navigate('/caregiver/signup');
  };

  const handleFamilyMemberClick = () => {
    navigate('/family-member/signup');
  };

  return (
    <div className="roles-page">
      <div className="roles-bg">
        <div className="left-section">
          <img className="main-image" alt="Registration" src={commonReg} />
          <div className="welcome-text">
            <h1 className="welcome-title">Welcome to SilverCare!</h1>
            <p className="welcome-description">
              Choose your role to get started with our comprehensive
              <br /> 
              elderly care platform. Connect with caregivers, families,
              and healthcare professionals — all in one place
            </p>
          </div>
        </div>

        <div className="right-section">
          <div className="form-container">
            <div className="form-header">
              <h2 className="form-title">Choose Your Role</h2>
              
            </div>

            <div className="roles-selection">
              <div className="form-section">
                <h3 className="section-title">Select Registration Type</h3>
                <p className="section-subtitle">Choose the option that best describes you</p>

                <div className="role-options">
                  <div className="role-card" onClick={handleCaregiverClick}>
                    <div className="role-content">
                      <div className="role-icon">👩‍⚕️</div>
                      <h4 className="role-title">Caregiver</h4>
                      <p className="role-description">
                        Professional caregivers providing elderly care services
                      </p>
                      <div className="role-features">
                        <span className="feature">• Manage client profiles</span>
                        <span className="feature">• Schedule appointments</span>
                        <span className="feature">• Track care activities</span>
                      </div>
                    </div>
                    <button className="role-btn caregiver-btn">
                      Register as Caregiver
                    </button>
                  </div>

                  <div className="role-card" onClick={handleFamilyMemberClick}>
                    <div className="role-content">
                      <div className="role-icon">👨‍👩‍👧‍👦</div>
                      <h4 className="role-title">Family Member</h4>
                      <p className="role-description">
                        Family members seeking care services for their loved ones
                      </p>
                      <div className="role-features">
                        <span className="feature">• Find qualified caregivers</span>
                        <span className="feature">• Monitor care progress</span>
                        <span className="feature">• Communicate with care team</span>
                      </div>
                    </div>
                    <button className="role-btn family-btn">
                      Register as Family Member
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-footer">
              <p className="login-prompt">Already Have An Account?</p>
              <Link to="/login" className="sign-in-link">Log In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
