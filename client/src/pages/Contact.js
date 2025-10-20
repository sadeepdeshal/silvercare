import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/navbar';
import styles from '../components/css/Contact.module.css';

const Contact = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    userType: 'family'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Simulate form submission - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would typically send the form data to your backend
      console.log('Form submitted:', formData);
      
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        userType: 'family'
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to navigate to appropriate dashboard based on user role
  const navigateToDashboard = () => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }

    const role = currentUser.role?.toLowerCase();
    switch (role) {
      case 'family_member':
        navigate('/family-member/dashboard');
        break;
      case 'elder':
        navigate('/elder/dashboard');
        break;
      case 'doctor':
        navigate('/doctor/dashboard');
        break;
      case 'caregiver':
        navigate('/caregiver/dashboard');
        break;
      case 'healthprofessional':
        navigate('/healthprofessional/dashboard');
        break;
      case 'admin':
        navigate('/admin/dashboard');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <div className={styles.container}>
      <Navbar />
      
      <div className={styles.content}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Contact SilverCare</h1>
            <p className={styles.heroSubtitle}>
              We're here to help. Reach out to us with any questions, concerns, or feedback.
            </p>
            {isAuthenticated && (
              <div className={styles.heroActions}>
                <button 
                  className={styles.dashboardButton}
                  onClick={navigateToDashboard}
                >
                  ← Back to Dashboard
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Contact Form and Info Section */}
        <section className={styles.contactSection}>
          <div className={styles.sectionContent}>
            <div className={styles.contactGrid}>
              {/* Contact Form */}
              <div className={styles.formContainer}>
                <h2 className={styles.formTitle}>Send us a Message</h2>
                <p className={styles.formSubtitle}>
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>

                <form onSubmit={handleSubmit} className={styles.contactForm}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="name" className={styles.label}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className={styles.input}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="email" className={styles.label}>
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className={styles.input}
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="phone" className={styles.label}>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="userType" className={styles.label}>
                        I am a *
                      </label>
                      <select
                        id="userType"
                        name="userType"
                        value={formData.userType}
                        onChange={handleInputChange}
                        required
                        className={styles.select}
                      >
                        <option value="family">Family Member</option>
                        <option value="elder">Elder</option>
                        <option value="caregiver">Caregiver</option>
                        <option value="doctor">Healthcare Professional</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="subject" className={styles.label}>
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className={styles.input}
                      placeholder="What is this regarding?"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="message" className={styles.label}>
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows="6"
                      className={styles.textarea}
                      placeholder="Please provide details about your inquiry..."
                    />
                  </div>

                  {submitStatus === 'success' && (
                    <div className={styles.successMessage}>
                      <span className={styles.successIcon}>✅</span>
                      Thank you for your message! We'll get back to you within 24 hours.
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div className={styles.errorMessage}>
                      <span className={styles.errorIcon}>❌</span>
                      Sorry, there was an error sending your message. Please try again.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={styles.submitButton}
                  >
                    {isSubmitting ? (
                      <>
                        <span className={styles.spinner}></span>
                        Sending...
                      </>
                    ) : (
                      'Send Message'
                    )}
                  </button>
                </form>
              </div>

              {/* Contact Info */}
              <div className={styles.infoContainer}>
                <h2 className={styles.infoTitle}>Get in Touch</h2>
                <p className={styles.infoSubtitle}>
                  Multiple ways to reach our support team.
                </p>

                <div className={styles.contactMethods}>
                  <div className={styles.contactMethod}>
                    <div className={styles.methodIcon}>📞</div>
                    <div className={styles.methodContent}>
                      <h3 className={styles.methodTitle}>Phone Support</h3>
                      <p className={styles.methodText}>+1 (555) 123-4567</p>
                      <p className={styles.methodDetails}>Mon-Fri: 8AM-8PM EST</p>
                      <p className={styles.methodDetails}>Sat-Sun: 9AM-5PM EST</p>
                    </div>
                  </div>

                  <div className={styles.contactMethod}>
                    <div className={styles.methodIcon}>📧</div>
                    <div className={styles.methodContent}>
                      <h3 className={styles.methodTitle}>Email Support</h3>
                      <p className={styles.methodText}>support@silvercare.com</p>
                      <p className={styles.methodDetails}>Response within 24 hours</p>
                    </div>
                  </div>

                  <div className={styles.contactMethod}>
                    <div className={styles.methodIcon}>🏢</div>
                    <div className={styles.methodContent}>
                      <h3 className={styles.methodTitle}>Office Address</h3>
                      <p className={styles.methodText}>
                        123 Healthcare Plaza<br />
                        Suite 456<br />
                        New York, NY 10001
                      </p>
                    </div>
                  </div>

                  <div className={styles.contactMethod}>
                    <div className={styles.methodIcon}>🚨</div>
                    <div className={styles.methodContent}>
                      <h3 className={styles.methodTitle}>Emergency</h3>
                      <p className={styles.methodText}>+1 (555) 911-CARE</p>
                      <p className={styles.methodDetails}>24/7 Emergency Line</p>
                    </div>
                  </div>
                </div>

                {/* FAQ Link */}
                <div className={styles.faqSection}>
                  <h3 className={styles.faqTitle}>Frequently Asked Questions</h3>
                  <p className={styles.faqText}>
                    Check our FAQ section for quick answers to common questions.
                  </p>
                  <button 
                    className={styles.faqButton}
                    onClick={() => window.location.href = '/faq'}
                  >
                    View FAQ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Support Hours Section */}
        <section className={styles.hoursSection}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Support Hours</h2>
            <div className={styles.hoursGrid}>
              <div className={styles.hoursCard}>
                <h3 className={styles.hoursTitle}>General Support</h3>
                <div className={styles.hoursList}>
                  <div className={styles.hoursItem}>
                    <span className={styles.day}>Monday - Friday</span>
                    <span className={styles.time}>8:00 AM - 8:00 PM EST</span>
                  </div>
                  <div className={styles.hoursItem}>
                    <span className={styles.day}>Saturday - Sunday</span>
                    <span className={styles.time}>9:00 AM - 5:00 PM EST</span>
                  </div>
                </div>
              </div>

              <div className={styles.hoursCard}>
                <h3 className={styles.hoursTitle}>Technical Support</h3>
                <div className={styles.hoursList}>
                  <div className={styles.hoursItem}>
                    <span className={styles.day}>Monday - Friday</span>
                    <span className={styles.time}>9:00 AM - 6:00 PM EST</span>
                  </div>
                  <div className={styles.hoursItem}>
                    <span className={styles.day}>Saturday</span>
                    <span className={styles.time}>10:00 AM - 4:00 PM EST</span>
                  </div>
                </div>
              </div>

              <div className={styles.hoursCard}>
                <h3 className={styles.hoursTitle}>Emergency Care</h3>
                <div className={styles.hoursList}>
                  <div className={styles.hoursItem}>
                    <span className={styles.day}>Every Day</span>
                    <span className={styles.time}>24/7 Available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p className={styles.footerText}>
            © 2024 SilverCare. All rights reserved. Your trusted partner in elder care.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Contact;