import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/navbar';
import styles from "../../components/css/caregiver/elder.module.css";
import CaregiverLayout from '../../components/CaregiverLayout';
import caregiverApi from '../../services/caregiverApi2';
import { useAuth } from '../../context/AuthContext';

const ElderPage = () => {
  const params = useParams();
  const { elderId } = params;
  const location = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [elder, setElder] = useState(null);
  const [familyMember, setFamilyMember] = useState(null);
  const [carelogs, setCarelogs] = useState([]);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterMonthDropdown, setFilterMonthDropdown] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [newReport, setNewReport] = useState({
    notes: '',
    mood: 'good',
    health_status: '',
    medications_given: '',
    activities: '',
    concerns: ''
  });

  // Comprehensive debug logging
  console.log('=== ElderPage Debug Information ===');
  console.log('All URL params:', params);
  console.log('Extracted elderId:', elderId);
  console.log('Location object:', location);
  console.log('Current pathname:', location.pathname);
  console.log('Current search:', location.search);
  console.log('Current hash:', location.hash);
  console.log('Full URL:', window.location.href);
  console.log('User object:', user);
  console.log('================================');

  useEffect(() => {
    console.log('useEffect triggered with:', { user, elderId, caregiver_id: user?.caregiver_id });
    
    if (!user || !user.caregiver_id || !elderId) {
      console.log('Early return from useEffect - missing data:', { 
        hasUser: !!user, 
        hasCaregiverId: !!user?.caregiver_id, 
        hasElderId: !!elderId 
      });
      return;
    }
    
    console.log('Calling fetchElderData with elderId:', elderId);
    fetchElderData();
  }, [user, elderId]);

  const fetchElderData = async () => {
    try {
      setLoading(true);
      const caregiverId = user.caregiver_id;
      
      console.log('Fetching elder data for elderId:', elderId, 'caregiverId:', caregiverId);
      
      const [elderData, carelogsData] = await Promise.all([
        caregiverApi.getElderDetails(elderId),
        caregiverApi.getElderCarelogs(caregiverId, elderId)
      ]);
      
      console.log('Elder data received:', elderData);
      console.log('Carelogs data received:', carelogsData);
      
      setElder(elderData.elder);
      setFamilyMember(elderData.familyMember);
      setCarelogs(carelogsData.carelogs || []);
    } catch (error) {
      console.error('Error fetching elder data:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReport = async (e) => {
    e.preventDefault();
    try {
      await caregiverApi.addElderReport(user.caregiver_id, elderId, newReport);
      setShowReportModal(false);
      setNewReport({
        notes: '',
        mood: 'good',
        health_status: '',
        medications_given: '',
        activities: '',
        concerns: ''
      });
      fetchElderData(); // Refresh data
    } catch (error) {
      console.error('Error adding report:', error);
    }
  };

  // Helper function to get Sri Lanka date string (UTC+5:30)
  const getLocalDateString = (date) => {
    const utcDate = new Date(date);
    // Convert to Sri Lanka time (UTC+5:30)
    const sriLankaTime = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
    return sriLankaTime.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <CaregiverLayout>
          <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 60, height: 60, border: '6px solid #e2e8f0', borderTop: '6px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 24 }} />
            <p style={{ color: '#667eea', fontSize: 20, fontWeight: 500 }}>Loading elder details...</p>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        </CaregiverLayout>
      </>
    );
  }

  if (!elder) {
    return (
      <>
        <Navbar />
        <CaregiverLayout>
          <div className={styles.errorContainer}>
            <h2>Elder not found</h2>
            <div style={{margin: '20px 0', padding: '20px', background: '#f7fafc', borderRadius: '8px'}}>
              <h3>Debug Information:</h3>
              <p><strong>Elder ID from URL:</strong> {elderId || 'undefined'}</p>
              <p><strong>User object:</strong> {user ? 'Present' : 'Missing'}</p>
              <p><strong>User caregiver_id:</strong> {user?.caregiver_id || 'undefined'}</p>
              <p><strong>Loading state:</strong> {loading ? 'true' : 'false'}</p>
            </div>
            
          </div>
        </CaregiverLayout>
      </>
    );
  }

  // Helper: get months January-December (no year)
  const getMonthsList = () => {
    return [
      { label: 'January', value: '01' },
      { label: 'February', value: '02' },
      { label: 'March', value: '03' },
      { label: 'April', value: '04' },
      { label: 'May', value: '05' },
      { label: 'June', value: '06' },
      { label: 'July', value: '07' },
      { label: 'August', value: '08' },
      { label: 'September', value: '09' },
      { label: 'October', value: '10' },
      { label: 'November', value: '11' },
      { label: 'December', value: '12' },
    ];
  };

  // Use dropdown if selected, else use input value (month only)
  const effectiveMonth = filterMonthDropdown || filterMonth;
  const effectiveYear = filterYear;

  // Filter carelogs by month (all years) or by month+year, and date
  const filteredCarelogs = carelogs.filter(report => {
    const reportDate = new Date(report.date);
    let match = true;
    if (effectiveMonth) {
      // effectiveMonth is in format 'MM'
      const month = effectiveMonth.length === 2 ? effectiveMonth : effectiveMonth.slice(5, 7); // support input type="month" as well
      match = match && String(reportDate.getMonth() + 1).padStart(2, '0') === month;
      if (effectiveYear) {
        match = match && reportDate.getFullYear() === Number(effectiveYear);
      }
    }
    if (filterDate) {
      // filterDate is in format 'YYYY-MM-DD'
      const filter = new Date(filterDate);
      match = match && reportDate.toDateString() === filter.toDateString();
    }
    return match;
  });

  return (
    <>
      <Navbar />
      <CaregiverLayout>
        <div className={styles.elderPage} style={{ fontFamily: "'Segoe UI', sans-serif" }}>
          {/* Back Button */}
          <div style={{ marginBottom: '20px' }}>
            <button 
              onClick={() => navigate('/caregiver/elders')} 
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)',
                transition: 'all 0.3s ease',
                fontFamily: "'Segoe UI', sans-serif"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.25)';
              }}
            >
              <span style={{ fontSize: '18px' }}>←</span>
              Back to all elders
            </button>
          </div>

          {/* Header */}
          <div style={{ marginBottom: '30px' }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 700,
              margin: 0,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: "'Segoe UI', sans-serif"
            }}>
              Elder Care Management
            </h1>
          </div>

          <div className={styles.contentGrid}>
            {/* Elder Details Card - Creative Design */}
            <div style={{
              background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)',
              borderRadius: '24px',
              padding: '32px',
              boxShadow: '0 10px 40px rgba(102, 126, 234, 0.15)',
              border: '2px solid rgba(102, 126, 234, 0.1)',
              position: 'relative',
              overflow: 'hidden',
              fontFamily: "'Segoe UI', sans-serif"
            }}>
              {/* Decorative Background Element */}
              <div style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '200px',
                height: '200px',
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                borderRadius: '50%',
                filter: 'blur(40px)'
              }}></div>

              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '28px',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}>
                  👴
                </div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  margin: 0,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Elder Information
                </h2>
              </div>

              {/* Profile Section */}
              <div style={{
                position: 'relative',
                zIndex: 1
              }}>
                {/* Details */}
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: '#1f2937',
                    margin: '0 0 8px 0'
                  }}>
                    {elder.name}
                  </h3>
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    marginBottom: '20px',
                    fontSize: '0.95rem',
                    color: '#6b7280',
                    fontWeight: 500
                  }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      color: '#667eea',
                      fontWeight: 600
                    }}>
                      {elder.age} years
                    </span>
                    <span style={{
                      background: 'linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      color: '#764ba2',
                      fontWeight: 600
                    }}>
                      {elder.gender}
                    </span>
                  </div>

                  {/* Info Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '16px'
                  }}>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.7)',
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid rgba(102, 126, 234, 0.1)'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '4px'
                      }}>
                        📞 Contact
                      </div>
                      <div style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: '#1f2937'
                      }}>
                        {elder.contact}
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(255, 255, 255, 0.7)',
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid rgba(102, 126, 234, 0.1)'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '4px'
                      }}>
                        ✉️ Email
                      </div>
                      <div style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: '#1f2937',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {elder.email || 'Not provided'}
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(255, 255, 255, 0.7)',
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid rgba(102, 126, 234, 0.1)',
                      gridColumn: 'span 2'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '4px'
                      }}>
                        📍 Address
                      </div>
                      <div style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: '#1f2937'
                      }}>
                        {elder.address}, {elder.district}
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(255, 255, 255, 0.7)',
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid rgba(102, 126, 234, 0.1)'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '4px'
                      }}>
                        🆔 NIC
                      </div>
                      <div style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: '#1f2937'
                      }}>
                        {elder.nic}
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(255, 255, 255, 0.7)',
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid rgba(102, 126, 234, 0.1)'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '4px'
                      }}>
                        🏥 Medical Conditions
                      </div>
                      <div style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: '#dc2626'
                      }}>
                        {elder.medical_conditions || 'None specified'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Family Contact Card - Creative Design */}
            {familyMember && (
              <div style={{
                background: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)',
                borderRadius: '24px',
                padding: '32px',
                boxShadow: '0 10px 40px rgba(251, 146, 60, 0.15)',
                border: '2px solid rgba(251, 146, 60, 0.1)',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: "'Segoe UI', sans-serif"
              }}>
                {/* Decorative Background Element */}
                <div style={{
                  position: 'absolute',
                  top: '-50px',
                  left: '-50px',
                  width: '200px',
                  height: '200px',
                  background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(249, 115, 22, 0.1) 100%)',
                  borderRadius: '50%',
                  filter: 'blur(40px)'
                }}></div>

                {/* Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '28px',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    boxShadow: '0 4px 12px rgba(251, 146, 60, 0.3)'
                  }}>
                    👨‍👩‍👧‍👦
                  </div>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    margin: 0,
                    background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    Family Contact
                  </h2>
                </div>

                {/* Family Details */}
                <div style={{
                  position: 'relative',
                  zIndex: 1
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '16px'
                  }}>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(251, 146, 60, 0.15)',
                      gridColumn: 'span 2'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '6px'
                      }}>
                        👤 Name
                      </div>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: '#1f2937'
                      }}>
                        {familyMember.name}
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(251, 146, 60, 0.15)'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '6px'
                      }}>
                        📱 Mobile
                      </div>
                      <a 
                        href={`tel:${familyMember.phone}`}
                        style={{
                          fontSize: '1rem',
                          fontWeight: 700,
                          color: '#f97316',
                          textDecoration: 'none',
                          display: 'block',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#ea580c';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#f97316';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        {familyMember.phone}
                      </a>
                    </div>

                    <div style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(251, 146, 60, 0.15)'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '6px'
                      }}>
                        ☎️ Landline
                      </div>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: '#1f2937'
                      }}>
                        {familyMember.phone_fixed || 'Not provided'}
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(251, 146, 60, 0.15)',
                      gridColumn: 'span 2'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '6px'
                      }}>
                        ✉️ Email
                      </div>
                      <a 
                        href={`mailto:${familyMember.email}`}
                        style={{
                          fontSize: '1rem',
                          fontWeight: 700,
                          color: '#f97316',
                          textDecoration: 'none',
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#ea580c';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#f97316';
                        }}
                      >
                        {familyMember.email}
                      </a>
                    </div>

                    <div style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(251, 146, 60, 0.15)',
                      gridColumn: 'span 2'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '6px'
                      }}>
                        🏠 Address
                      </div>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: '#1f2937'
                      }}>
                        {familyMember.address || 'Not provided'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Carelog Calendar Section */}
          <div className={styles.reportsSection}>
            <div className={styles.sectionHeader}>
              <h2>Carelogs</h2>
            </div>
            {/* Month Navigation */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '24px',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px'
            }}>
              <button 
                onClick={() => {
                  const newMonth = filterMonth === '' ? new Date().getMonth() - 1 : parseInt(filterMonth) - 1;
                  const newYear = filterYear === '' ? new Date().getFullYear() : parseInt(filterYear);
                  
                  if (newMonth < 0) {
                    setFilterMonth('11');
                    setFilterYear((newYear - 1).toString());
                  } else {
                    setFilterMonth(newMonth.toString());
                    setFilterYear(newYear.toString());
                  }
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '10px',
                  padding: '10px 18px',
                  fontSize: '18px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
              >
                ←
              </button>
              
              <select
                value={filterMonth === '' ? new Date().getMonth().toString() : filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                style={{
                  padding: '10px 16px',
                  fontSize: '15px',
                  fontWeight: 600,
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  color: '#667eea',
                  cursor: 'pointer',
                  minWidth: '140px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  outline: 'none'
                }}
              >
                {getMonthsList().map((month, index) => (
                  <option key={index} value={index.toString()}>
                    {month.label}
                  </option>
                ))}
              </select>
              
              <select
                value={filterYear === '' ? new Date().getFullYear().toString() : filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                style={{
                  padding: '10px 14px',
                  fontSize: '15px',
                  fontWeight: 600,
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  color: '#764ba2',
                  cursor: 'pointer',
                  width: '100px',
                  height: '42px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  outline: 'none'
                }}
              >
                {Array.from({ length: 26 }, (_, i) => 2015 + i).map(year => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
              
              <button 
                onClick={() => {
                  const newMonth = filterMonth === '' ? new Date().getMonth() + 1 : parseInt(filterMonth) + 1;
                  const newYear = filterYear === '' ? new Date().getFullYear() : parseInt(filterYear);
                  
                  if (newMonth > 11) {
                    setFilterMonth('0');
                    setFilterYear((newYear + 1).toString());
                  } else {
                    setFilterMonth(newMonth.toString());
                    setFilterYear(newYear.toString());
                  }
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '10px',
                  padding: '10px 18px',
                  fontSize: '18px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
              >
                →
              </button>
            </div>

            {/* Calendar Grid */}
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
              borderRadius: '24px',
              padding: '36px',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.12)',
              border: '1px solid rgba(102, 126, 234, 0.1)'
            }}>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '20px'}}>
                {(() => {
                  const displayMonth = filterMonth === '' ? new Date().getMonth() : parseInt(filterMonth);
                  const displayYear = filterYear === '' ? new Date().getFullYear() : parseInt(filterYear);
                  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
                  
                  // Get today's date in Sri Lanka timezone
                  const now = new Date();
                  const sriLankaToday = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
                  const todayStr = sriLankaToday.toISOString().split('T')[0];
                  
                  // Get assignment date range
                  const assignmentStart = elder.start_date ? new Date(elder.start_date) : null;
                  const assignmentEnd = elder.end_date ? new Date(elder.end_date) : null;
                  
                  if (assignmentStart) assignmentStart.setHours(0, 0, 0, 0);
                  if (assignmentEnd) assignmentEnd.setHours(0, 0, 0, 0);
                  
                  const calendarDays = [];
                  for (let day = 1; day <= daysInMonth; day++) {
                    const targetDate = new Date(displayYear, displayMonth, day);
                    targetDate.setHours(0, 0, 0, 0);
                    
                    // Only include dates within assignment period
                    if (assignmentStart && assignmentEnd) {
                      if (targetDate >= assignmentStart && targetDate <= assignmentEnd) {
                        calendarDays.push(day);
                      }
                    } else {
                      calendarDays.push(day);
                    }
                  }
                  
                  return calendarDays.map((day, index) => {
                    const targetDate = new Date(displayYear, displayMonth, day);
                    targetDate.setHours(0, 0, 0, 0);
                    
                    const dateStr = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayReport = carelogs.find(report => {
                      if (!report.date) return false;
                      const reportDate = getLocalDateString(report.date);
                      return reportDate === dateStr;
                    });
                    
                    const isToday = dateStr === todayStr;
                    const isPast = dateStr < todayStr;
                    const hasReport = dayReport && dayReport.carelog_id;
                    
                    return (
                      <div
                        key={index}
                        onClick={() => {
                          if (hasReport) {
                            // Show report details
                            alert(`Report for ${dateStr}:\n\nMood: ${dayReport.mood}\n\nNotes: ${dayReport.notes}\n\nHealth: ${dayReport.health_status || 'N/A'}\n\nActivities: ${dayReport.activities || 'N/A'}\n\nConcerns: ${dayReport.concerns || 'N/A'}`);
                          } else if (isToday) {
                            // Open modal to submit report for today
                            setShowReportModal(true);
                          }
                        }}
                        style={{
                          background: isToday 
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                            : hasReport
                              ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                              : 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                          border: isToday 
                            ? '3px solid #764ba2' 
                            : hasReport
                              ? '2px solid #10b981' 
                              : '2px solid #e5e7eb',
                          borderRadius: '20px',
                          padding: '20px 16px',
                          cursor: (hasReport || isToday) ? 'pointer' : 'default',
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          minHeight: '120px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          position: 'relative',
                          boxShadow: isToday 
                            ? '0 8px 24px rgba(118, 75, 162, 0.35)' 
                            : hasReport
                              ? '0 4px 12px rgba(16, 185, 129, 0.15)'
                              : '0 2px 6px rgba(0, 0, 0, 0.04)',
                          opacity: (hasReport || isToday) ? 1 : 0.5,
                          transform: 'scale(1)'
                        }}
                        onMouseEnter={(e) => {
                          if (hasReport || isToday) {
                            e.currentTarget.style.transform = 'scale(1.05) translateY(-4px)';
                            e.currentTarget.style.boxShadow = isToday 
                              ? '0 12px 32px rgba(118, 75, 162, 0.45)' 
                              : '0 12px 28px rgba(16, 185, 129, 0.25)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (hasReport || isToday) {
                            e.currentTarget.style.transform = 'scale(1) translateY(0px)';
                            e.currentTarget.style.boxShadow = isToday 
                              ? '0 8px 24px rgba(118, 75, 162, 0.35)' 
                              : '0 4px 12px rgba(16, 185, 129, 0.15)';
                          }
                        }}
                      >
                        {isToday && (
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: 'rgba(255, 255, 255, 0.95)',
                            color: '#764ba2',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '5px 10px',
                            borderRadius: '20px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                            letterSpacing: '0.5px'
                          }}>
                            TODAY
                          </div>
                        )}
                        
                        <div style={{
                          fontSize: '13px', 
                          fontWeight: 700, 
                          color: isToday ? 'rgba(255, 255, 255, 0.9)' : '#9ca3af', 
                          marginBottom: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}>
                          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][targetDate.getDay()]}
                        </div>
                        
                        <div style={{
                          fontSize: '32px', 
                          fontWeight: 800, 
                          color: isToday ? '#ffffff' : hasReport ? '#10b981' : '#9ca3af',
                          marginBottom: '12px',
                          textShadow: isToday ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none'
                        }}>
                          {day}
                        </div>
                        
                        {hasReport && (
                          <div style={{
                            fontSize: '10px', 
                            fontWeight: 700, 
                            color: '#065f46',
                            background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                            padding: '7px 14px',
                            borderRadius: '20px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.8px',
                            border: '2px solid #10b981',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
                          }}>
                            <span style={{fontSize: '12px'}}>✓</span>
                            {dayReport.mood === 'good' && '😊'}
                            {dayReport.mood === 'neutral' && '😐'}
                            {dayReport.mood === 'bad' && '😞'}
                          </div>
                        )}
                        
                        {!hasReport && isToday && (
                          <div style={{
                            fontSize: '10px', 
                            fontWeight: 700, 
                            color: '#ffffff',
                            background: 'rgba(255, 255, 255, 0.25)',
                            padding: '7px 14px',
                            borderRadius: '20px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.8px',
                            border: '2px solid rgba(255, 255, 255, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                          }}>
                            <span style={{fontSize: '12px'}}>+</span>
                            Submit
                          </div>
                        )}
                        
                        {!hasReport && !isToday && isPast && (
                          <div style={{
                            fontSize: '10px', 
                            fontWeight: 700, 
                            color: '#dc2626',
                            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                            padding: '7px 14px',
                            borderRadius: '20px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.8px',
                            border: '2px solid #f87171',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)'
                          }}>
                            <span style={{fontSize: '12px'}}>✗</span>
                            Missed
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          {/* Add Report Modal */}
          {showReportModal && (
            <div className={styles.modalOverlay} onClick={() => setShowReportModal(false)}>
              <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                  <h2>Add Carelog for {elder.name}</h2>
                  <button 
                    className={styles.closeButton}
                    onClick={() => setShowReportModal(false)}
                  >
                    ✕
                  </button>
                </div>
                
                <form onSubmit={handleAddReport} className={styles.modalForm}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Elder's Mood</label>
                      <select 
                        value={newReport.mood}
                        onChange={(e) => setNewReport({...newReport, mood: e.target.value})}
                      >
                        <option value="good">😊 Good</option>
                        <option value="neutral">😐 Neutral</option>
                        <option value="bad">😞 Bad</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>General Care Notes *</label>
                    <textarea 
                      value={newReport.notes}
                      onChange={(e) => setNewReport({...newReport, notes: e.target.value})}
                      placeholder="Describe the daily care activities, observations, and general notes..."
                      rows={3}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Health Status</label>
                    <textarea 
                      value={newReport.health_status}
                      onChange={(e) => setNewReport({...newReport, health_status: e.target.value})}
                      placeholder="Note any health observations, vital signs, appetite, sleep patterns..."
                      rows={2}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Medications Given</label>
                    <textarea 
                      value={newReport.medications_given}
                      onChange={(e) => setNewReport({...newReport, medications_given: e.target.value})}
                      placeholder="List medications administered, times, and any reactions..."
                      rows={2}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Activities & Exercise</label>
                    <textarea 
                      value={newReport.activities}
                      onChange={(e) => setNewReport({...newReport, activities: e.target.value})}
                      placeholder="Physical activities, exercises, social interactions, hobbies..."
                      rows={2}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Concerns or Issues</label>
                    <textarea 
                      value={newReport.concerns}
                      onChange={(e) => setNewReport({...newReport, concerns: e.target.value})}
                      placeholder="Any concerns, incidents, or issues that need family attention..."
                      rows={2}
                    />
                  </div>

                  <div className={styles.modalActions}>
                    <button 
                      type="button" 
                      onClick={() => setShowReportModal(false)}
                      className={styles.cancelButton}
                    >
                      Cancel
                    </button>
                    <button type="submit" className={styles.submitButton}>
                      Submit Report
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </CaregiverLayout>
    </>
  );
};

export default ElderPage;