import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './LandingPage.module.css';
import logoSilver from '../components/images/logo_silver.png';
import familyMemberIcon from '../components/images/family-member1.png';
import elderMemberIcon from '../components/images/family_member.png';
import doctorIcon from '../components/images/doctor.png';
import aboutImage from '../components/images/banner.jpg';

const LandingPage = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  const features = [
    {
      icon: familyMemberIcon,
      title: 'Family Member Portal',
      description: 'Register and manage elderly relatives, book appointments, and receive real-time emergency alerts.'
    },
    {
      icon: elderMemberIcon,
      title: 'Elderly Support',
      description: 'Maintain medical history, receive reminders, and join virtual consultations with ease.'
    },
    {
      icon: doctorIcon,
      title: 'Doctor Dashboard',
      description: 'Manage professional profiles, approve appointments, and provide medical advice.'
    },
  ];

  const handleDashboardNavigation = () => {
    console.log('Navigation clicked - Auth state:', { isAuthenticated, currentUser });
    
    if (isAuthenticated && currentUser) {
      console.log('User role:', currentUser.role);
      switch (currentUser.role) {
        case 'elder':
          console.log('Navigating to elder dashboard');
          navigate('/elder/dashboard');
          break;
        case 'family_member':
          console.log('Navigating to family member dashboard');
          navigate('/family-member/dashboard');
          break;
        case 'healthprofessional':
          console.log('Navigating to health professional dashboard');
          navigate('/healthprofessional/dashboard');
          break;
        case 'caregiver':
          console.log('Navigating to caregiver dashboard');
          navigate('/caregiver/dashboard');
          break;
        case 'doctor':
          console.log('Navigating to doctor dashboard');
          navigate('/doctor/dashboard');
          break;
        case 'admin':
          console.log('Navigating to admin dashboard');
          navigate('/admin/dashboard');
          break;
        default:
          console.log('Unknown role, navigating to login');
          navigate('/login');
      }
    } else {
      console.log('Not authenticated, navigating to login');
      navigate('/login');
    }
  };

  const testimonials = [
    {
      name: 'Priya Perera',
      role: 'Family Member',
      content: 'SilverCare has made caring for my elderly parents so much easier. The emergency alerts give me peace of mind.',
      avatar: '👩'
    },
    {
      name: 'Dr. Kumara Silva',
      role: 'Medical Professional',
      content: 'The platform streamlines patient management and makes virtual consultations seamless.',
      avatar: '👨‍⚕️'
    },
    {
      name: 'Nimal Fernando',
      role: 'Caregiver',
      content: 'I can efficiently manage multiple patients and keep families updated on their loved ones.',
      avatar: '👨‍💼'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const handleGetStarted = () => {
    navigate('/roles');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.landingPage}>
      {/* Navigation Header */}
      <nav className={styles.navbar}>
        <div className={styles.navContainer}>
          <div className={styles.navLogo}>
            <img
              src={logoSilver}
              alt="SilverCare Logo"
              className={styles.logoImage}
            />
          </div>
          <div className={styles.navLinks}>
            <button onClick={() => scrollToSection('features')} className={styles.navLink}>
              Features
            </button>
            <button onClick={() => scrollToSection('about')} className={styles.navLink}>
              About
            </button>
            <button onClick={() => scrollToSection('testimonials')} className={styles.navLink}>
              Testimonials
            </button>
            {isAuthenticated ? (
              <button onClick={handleDashboardNavigation} className={styles.loginBtn}>
                Dashboard
              </button>
            ) : (
              <>
                <button onClick={handleLogin} className={styles.loginBtn}>
                  Login
                </button>
                <button onClick={handleGetStarted} className={styles.getStartedBtn}>
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Comprehensive Elder Care
              <span className={styles.highlight}> Management Platform</span>
            </h1>
            <p className={styles.heroSubtitle}>
              {isAuthenticated 
                ? `Welcome back! Access your personalized dashboard to manage your elder care needs.`
                : `Connect senior citizens with family members, doctors, caregivers, and mental health professionals.
                  Ensuring safety, comfort, and dignity for the elderly across Sri Lanka.`
              }
            </p>
            <div className={styles.heroButtons}>
              {isAuthenticated ? (
                <>
                  <button onClick={handleDashboardNavigation} className={styles.primaryBtn}>
                    Go to Dashboard
                  </button>
                  <button onClick={() => scrollToSection('features')} className={styles.secondaryBtn}>
                    Learn More
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleGetStarted} className={styles.primaryBtn}>
                    Get Started Today
                  </button>
                  <button onClick={() => scrollToSection('features')} className={styles.secondaryBtn}>
                    Learn More
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.features}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Our Services</h2>
            <p className={styles.sectionSubtitle}>
              Comprehensive tools designed to support every aspect of elder care
            </p>
          </div>
          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div key={index} className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  {typeof feature.icon === 'string' && (feature.icon.startsWith('data') || feature.icon.endsWith('.png')) ? (
                    <img src={feature.icon} alt={feature.title} className={styles.iconImage} />
                  ) : (
                    feature.icon
                  )}
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className={styles.about}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>About SilverCare</h2>
          </div>
          <div className={styles.aboutContent}>
            <p className={styles.aboutText}>
              At SilverCare, we are dedicated to revolutionizing elder care with innovative tools and compassionate support. Our platform connects families, caregivers, and healthcare professionals to ensure the best care for seniors.
            </p>
          </div>
          <div className={styles.aboutFeatures}>
            <div className={styles.aboutFeature}>
              <span className={styles.aboutFeatureIcon}>📈</span>
              <span>Real-time Health Monitoring</span>
            </div>
            <div className={styles.aboutFeature}>
              <span className={styles.aboutFeatureIcon}>🔒</span>
              <span>Secure Data Management</span>
            </div>
            <div className={styles.aboutFeature}>
              <span className={styles.aboutFeatureIcon}>💬</span>
              <span>Secure Communication</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className={styles.testimonials}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>What Our Users Say</h2>
            <p className={styles.sectionSubtitle}>
              Trusted by families, healthcare professionals, and caregivers across Sri Lanka
            </p>
          </div>
          <div className={styles.testimonialSlider}>
            <div className={styles.testimonialCard}>
              <div className={styles.testimonialContent}>
                <p className={styles.testimonialText}>
                  "{testimonials[currentSlide].content}"
                </p>
                <div className={styles.testimonialAuthor}>
                  <span className={styles.authorAvatar}>
                    {testimonials[currentSlide].avatar}
                  </span>
                  <div className={styles.authorInfo}>
                    <span className={styles.authorName}>
                      {testimonials[currentSlide].name}
                    </span>
                    <span className={styles.authorRole}>
                      {testimonials[currentSlide].role}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.testimonialDots}>
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`${styles.dot} ${index === currentSlide ? styles.activeDot : ''}`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>
              {isAuthenticated ? 'Welcome to SilverCare!' : 'Ready to Get Started?'}
            </h2>
            <p className={styles.ctaSubtitle}>
              {isAuthenticated 
                ? 'Access your personalized dashboard to manage all your elder care needs'
                : 'Join thousands of families who trust SilverCare for their elder care needs'
              }
            </p>
            <div className={styles.ctaButtons}>
              {isAuthenticated ? (
                <button onClick={handleDashboardNavigation} className={styles.ctaPrimaryBtn}>
                  Go to My Dashboard
                </button>
              ) : (
                <>
                  <button onClick={handleGetStarted} className={styles.ctaPrimaryBtn}>
                    Register Now
                  </button>
                  <button onClick={handleLogin} className={styles.ctaSecondaryBtn}>
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerContent}>
            <div className={styles.footerSection}>
              <div className={styles.footerLogo}>
                <span className={styles.logoIcon}>🩺</span>
                <span className={styles.logoText}>SilverCare</span>
              </div>
              <p className={styles.footerDescription}>
                Comprehensive elder care management platform ensuring safety,
                comfort, and dignity for the elderly across Sri Lanka.
              </p>
            </div>
            <div className={styles.footerSection}>
              <h4 className={styles.footerTitle}>Quick Links</h4>
              <ul className={styles.footerLinks}>
                <li><button onClick={() => scrollToSection('features')}>Features</button></li>
                <li><button onClick={() => scrollToSection('about')}>About</button></li>
                <li><button onClick={handleLogin}>Login</button></li>
                <li><button onClick={handleGetStarted}>Register</button></li>
              </ul>
            </div>
            <div className={styles.footerSection}>
              <h4 className={styles.footerTitle}>User Types</h4>
              <ul className={styles.footerLinks}>
                <li>Family Members</li>
                <li>Healthcare Professionals</li>
                <li>Caregivers</li>
                <li>Mental Health Professionals</li>
              </ul>
            </div>
            <div className={styles.footerSection}>
              <h4 className={styles.footerTitle}>Contact</h4>
              <div className={styles.contactInfo}>
                <p>📧 support@silvercare.lk</p>
                <p>📞 +94 11 234 5678</p>
                <p>📍 Colombo, Sri Lanka</p>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>© 2024 SilverCare. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;