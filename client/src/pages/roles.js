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

  const handleDoctorClick = () => {
    navigate('/doctor/signup');
  };

  const handleMentalHealthProfessionalClick = () => {
    navigate('/healthproffesional/signup');
  };

  return (
    <div className="roles-page">
      <div className="roles-bg">
        <div className="left-section">
          <img className="main-image" alt="Registration" src={commonReg} />

        </div>

        <div className="right-section">
          <div className="form-containe">
            <div className="form-header">
              
              
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

                  <div className="role-card" onClick={handleDoctorClick}>
                    <div className="role-content">
                      <div className="role-icon">👨‍⚕️</div>
                      <h4 className="role-title">Doctor</h4>
                      <p className="role-description">
                        Medical professionals providing healthcare services
                      </p>
                      <div className="role-features">
                        <span className="feature">• Manage patient records</span>
                        <span className="feature">• Provide medical consultations</span>
                        <span className="feature">• Monitor health conditions</span>
                      </div>
                    </div>
                    <button className="role-btn doctor-btn">
                      Register as Doctor
                    </button>
                  </div>

                  <div className="role-card" onClick={handleMentalHealthProfessionalClick}>
                    <div className="role-content">
                      <div className="role-icon">🧠</div>
                      <h4 className="role-title">Mental Health Professional</h4>
                      <p className="role-description">
                        Specialists providing mental health and wellness support
                      </p>
                      <div className="role-features">
                        <span className="feature">• Conduct therapy sessions</span>
                        <span className="feature">• Mental health assessments</span>
                        <span className="feature">• Wellness program management</span>
                      </div>
                    </div>
                    <button className="role-btn mental-health-btn">
                      Register as Counseller
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
