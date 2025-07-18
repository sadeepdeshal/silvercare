import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/loginApi";
import { useAuth } from "../context/AuthContext";
import loginImage from "../components/images/login.jpg";
import welcomeIcon from "../components/images/5220-1.jpg";
import nameIcon from "../components/images/group41.png";
import emailIcon from "../components/images/group.jpg";
import styles from "../components/css/login.module.css";
import Navbar from '../components/navbar';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await loginUser(formData);
      const { user, token, role } = response.data;
      
      // Use AuthContext to store user data
      const userData = {
        ...user,
        token,
        role
      };
      
      // Store in AuthContext (this will also handle localStorage)
      login(userData);
      
      console.log('Login successful:', { user, role });
      
      // Navigate based on role
      switch(role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'caregiver':
          navigate('/caregiver/dashboard');
          break;
        case 'family_member':
          navigate('/family-member/dashboard');
          break;
        case 'doctor':
          navigate('/doctor/dashboard');
          break;
        case 'healthprofessional':
          navigate('/healthprofessional/dashboard');
          break;
        case 'elder':
          navigate('/elder/dashboard');
          break;
        default:
          console.log('Unknown role:', role);
          navigate('/dashboard');
      }
      
    } catch (err) {
      console.error('Login error:', err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else if (err.response && err.response.status === 403) {
        // Handle pending approval specifically for both doctors and health professionals
        setError('Your account is pending approval. Please wait for admin confirmation before logging in.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className={styles.loginPage}>
        <div className={styles.bg}>
          <div className={styles.leftSection}>
            <img className={styles.mainImage} alt="Login" src={loginImage} />
            <div className={styles.welcomeText}>
              <h1 className={styles.welcomeTitle}>Welcome Back to SilverCare!</h1>
              <p className={styles.welcomeDescription}>
                Sign in to your account to continue providing
                <br />
                exceptional care and support to your community.
                <br />
                Your dedication makes a difference every day.
              </p>
            </div>
          </div>

          <div className={styles.rightSection}>
            <div className={styles.formContainer}>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>Log In to Your Account</h2>
                <img className={styles.welcomeImage} alt="Welcome" src={welcomeIcon} />
              </div>

              <form onSubmit={handleSubmit} className={styles.loginForm}>
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>Login Information</h3>
                  <p className={styles.sectionSubtitle}>Please enter your credentials to continue</p>

                  {error && (
                    <div className={styles.errorMessage}>
                      {error}
                    </div>
                  )}

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Email</label>
                    <div className={styles.inputContainer}>
                      <img className={styles.inputIcon} alt="Email icon" src={emailIcon} />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email address"
                        className={styles.formInput}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Password</label>
                    <div className={styles.inputContainer}>
                      <img className={styles.inputIcon} alt="Password icon" src={nameIcon} />
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter your password"
                        className={styles.formInput}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className={styles.formOptions}>
                    <div className={styles.rememberMe}>
                      <input type="checkbox" id="remember" />
                      <label htmlFor="remember">Remember me</label>
                    </div>
                    <Link to="/forgot-password" className={styles.forgotPassword}>
                      Forgot Password?
                    </Link>
                  </div>
                </div>

                <button type="submit" className={styles.primaryBtn} disabled={loading}>
                  <span className={styles.buttonText}>
                    {loading ? 'Logging In...' : 'Log In'}
                  </span>
                </button>
              </form>

              <div className={styles.formFooter}>
                <p className={styles.signupPrompt}>Don't Have An Account?</p>
                <div className={styles.signupLinks}>
                  <Link to="/roles" className={styles.signUpLink}>Sign Up</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
