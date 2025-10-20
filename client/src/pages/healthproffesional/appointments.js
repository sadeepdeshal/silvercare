import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/navbar';
import HealthProfessionalSidebar from '../../components/HealthProfessionalSidebar';
import axios from 'axios';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const calculateAge = (dob) => {
  if (!dob) return 'N/A';
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const AppointmentDetails = () => {
  const { currentUser } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allSessionData, setAllSessionData] = useState([]); // Store all sessions from API
  const [sessionData, setSessionData] = useState([]); // Filtered sessions to display
  const [pagination, setPagination] = useState({ total: 0, limit: 10, offset: 0, hasMore: false });
  const [errorMessage, setErrorMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [counselorId, setCounselorId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState(''); // New state for search query

  useEffect(() => {
    const fetchCounselorId = async () => {
      setLoading(true);
      const storedUser = localStorage.getItem('silvercare_user');
      if (!storedUser) {
        setErrorMessage('No user data found in local storage');
        setLoading(false);
        return;
      }

      const userData = JSON.parse(storedUser);
      if (!userData.user_id || userData.role !== 'healthprofessional') {
        setErrorMessage('Invalid user data or role in local storage');
        setLoading(false);
        return;
      }

      try {
        const token = userData.token;
        const response = await axios.get(`http://localhost:5000/api/healthprofessional/counselor-id/${userData.user_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to fetch counselor_id');
        }

        setCounselorId(response.data.counselor_id.toString());
      } catch (err) {
        console.error('Error fetching counselor_id:', err);
        setErrorMessage(err.message || 'Failed to load counselor details');
      } finally {
        setLoading(false);
      }
    };

    fetchCounselorId();
  }, []);

  useEffect(() => {
    if (counselorId) {
      fetchSessionDetails();
    }
  }, [counselorId, statusFilter, currentPage, limit]); // Removed searchQuery from dependency

  const fetchSessionDetails = async () => {
    try {
      const storedUser = localStorage.getItem('silvercare_user');
      const token = storedUser ? JSON.parse(storedUser).token : null;
      const offset = (currentPage - 1) * limit;
      const url = `http://localhost:5000/api/healthprofessional/counselors/${counselorId}/sessions?status=${statusFilter}&limit=${limit}&offset=${offset}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch session details');
      }

      // Filter sessions to ensure they match the logged-in user's counselorId (optional safety check)
      const filteredSessions = Array.isArray(response.data.sessions) 
        ? response.data.sessions.filter(session => session.counselor_id.toString() === counselorId)
        : [];
      setAllSessionData(filteredSessions); // Store all sessions
      setSessionData(filteredSessions.slice(offset, offset + limit)); // Set initial filtered data
      setPagination(response.data.pagination || { total: response.data.sessions.length || 0, limit, offset, hasMore: (offset + limit) < (response.data.sessions.length || 0) });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching session details:', err);
      setErrorMessage(err.message || 'Failed to load session details');
      setLoading(false);
    }
  };

  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    const offset = (newPage - 1) * limit;
    setSessionData(allSessionData.slice(offset, offset + limit)); // Update displayed data based on page
  };

  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on search
    const offset = 0;
    const filteredData = allSessionData.filter(session =>
      session.elder_name.toLowerCase().includes(query) || session.session_id.toString().includes(query)
    );
    setSessionData(filteredData.slice(offset, offset + limit)); // Filter and paginate
    setPagination({ total: filteredData.length, limit, offset, hasMore: (offset + limit) < filteredData.length });
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <HealthProfessionalSidebar onToggleCollapse={setSidebarCollapsed} />
        <div style={{...styles.mainContent, marginLeft: sidebarCollapsed ? '80px' : '250px'}}>
          <Navbar />
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p>Loading appointments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <HealthProfessionalSidebar onToggleCollapse={setSidebarCollapsed} />
      <div style={{...styles.mainContent, marginLeft: sidebarCollapsed ? '80px' : '250px'}}>
        <Navbar />
        
        <div style={styles.content}>
          <div style={styles.header}>
            <h1 style={styles.title}>Appointment Details</h1>
            <p style={styles.subtitle}>View and manage your scheduled appointments</p>
          </div>

          {errorMessage && (
            <div style={styles.errorMessage}>
              <span>⚠️</span>
              {errorMessage}
            </div>
          )}

          <div style={styles.filterContainer}>
            <label style={styles.filterLabel}>Filter by Appointment Status:</label>
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              style={styles.filterSelect}
            >
              <option value="">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {/* Search Component */}
            <label style={styles.filterLabel}>Search:</label>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by name or ID..."
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                fontSize: '0.875rem',
                color: '#1e293b',
                width: '200px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {sessionData.length === 0 && !errorMessage && (
            <div style={styles.emptyMessage}>No appointments scheduled.</div>
          )}

          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Appointment ID</th>
                  <th style={styles.th}>Elder Name</th>
                  <th style={styles.th}>Date & Time</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Session Type</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessionData.map((session, index) => (
                  <React.Fragment key={session.session_id}>
                    <tr 
                      style={{
                        ...styles.tr,
                        ...(expandedRow === index ? styles.expandedRowBg : {})
                      }}
                      onMouseEnter={(e) => {
                        if (expandedRow !== index) {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (expandedRow !== index) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <td style={styles.td}>
                        <strong style={styles.idText}>{session.session_id}</strong>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.nameCell}>
                          {session.elder_photo ? (
                            <img 
                              src={`http://localhost:5000/api/healthprofessional/${session.elder_photo.replace(/\\/g, '/')}`} 
                              alt={session.elder_name} 
                              style={styles.avatar}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const placeholder = e.target.nextSibling;
                                if (placeholder) placeholder.style.display = 'flex';
                              }}
                            />
                          ) : (
                            <div style={styles.avatarPlaceholder}>
                              {session.elder_name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={styles.nameText}>{session.elder_name}</div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.ageText}>{formatDate(session.date_time)}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          ...(session.status === 'confirmed' ? styles.statusActive : session.status === 'completed' ? styles.statusCompleted : session.status === 'cancelled' ? styles.statusInactive : {})
                        }}>
                          {session.status || 'N/A'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.districtText}>{session.session_type || 'N/A'}</span>
                      </td>
                      <td style={styles.td}>
                        <button 
                          onClick={() => toggleRow(index)}
                          style={styles.expandBtn}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.35)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          {expandedRow === index ? '▼ Hide Details' : '► View Details'}
                        </button>
                      </td>
                    </tr>
                    
                    {expandedRow === index && (
                      <tr style={styles.detailsRow}>
                        <td colSpan="6" style={styles.detailsTd}>
                          <div style={styles.expandedContent}>
                            <div style={styles.detailsGrid}>
                              {/* Appointment Details */}
                              <div style={styles.detailSection}>
                                <h3 style={styles.detailSectionTitle}>📅 Appointment Details</h3>
                                <div style={styles.detailGrid}>
                                  <div style={styles.detailItem}>
                                    <label style={styles.detailLabel}>Date & Time</label>
                                    <span style={styles.detailValue}>{formatDate(session.date_time)}</span>
                                  </div>
                                  <div style={styles.detailItem}>
                                    <label style={styles.detailLabel}>Session Type</label>
                                    <span style={styles.detailValue}>{session.session_type || 'N/A'}</span>
                                  </div>
                                  <div style={styles.detailItem}>
                                    <label style={styles.detailLabel}>Duration</label>
                                    <span style={styles.detailValue}>{session.session_duration || 'N/A'}</span>
                                  </div>
                                  <div style={styles.detailItem}>
                                    <label style={styles.detailLabel}>Meeting Link</label>
                                    <span style={styles.detailValue}>
                                      <a href={session.meeting_link} target="_blank" rel="noopener noreferrer">{session.meeting_link || 'N/A'}</a>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Notes and Concerns */}
                              <div style={styles.detailSection}>
                                <h3 style={styles.detailSectionTitle}>📝 Notes & Concerns</h3>
                                <div style={styles.detailGrid}>
                                  <div style={{...styles.detailItem, gridColumn: '1 / -1'}}>
                                    <label style={styles.detailLabel}>Notes</label>
                                    <span style={styles.medicalValue}>{session.notes || 'No notes available'}</span>
                                  </div>
                                  <div style={{...styles.detailItem, gridColumn: '1 / -1'}}>
                                    <label style={styles.detailLabel}>Patient Concerns</label>
                                    <span style={styles.medicalValue}>{session.patient_concerns || 'No concerns recorded'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Elder Information */}
                              <div style={styles.detailSection}>
                                <h3 style={styles.detailSectionTitle}>👤 Elder Information</h3>
                                <div style={styles.detailGrid}>
                                  <div style={styles.detailItem}>
                                    <label style={styles.detailLabel}>Name</label>
                                    <span style={styles.detailValue}>{session.elder_name}</span>
                                  </div>
                                  <div style={styles.detailItem}>
                                    <label style={styles.detailLabel}>Contact</label>
                                    <span style={styles.detailValue}>{session.elder_contact}</span>
                                  </div>
                                  <div style={styles.detailItem}>
                                    <label style={styles.detailLabel}>Gender</label>
                                    <span style={styles.detailValue}>{session.elder_gender}</span>
                                  </div>
                                  <div style={styles.detailItem}>
                                    <label style={styles.detailLabel}>Age</label>
                                    <span style={styles.detailValue}>{calculateAge(session.elder_dob)} years</span>
                                  </div>
                                  <div style={styles.detailItem}>
                                    <label style={styles.detailLabel}>District</label>
                                    <span style={styles.detailValue}>{session.elder_district}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Counselor Information */}
                              <div style={styles.detailSection}>
                                <h3 style={styles.detailSectionTitle}>👨‍⚕️ Counselor Information</h3>
                                <div style={styles.detailGrid}>
                                  <div style={styles.detailItem}>
                                    <label style={styles.detailLabel}>Name</label>
                                    <span style={styles.detailValue}>{session.counselor_name}</span>
                                  </div>
                                  <div style={styles.detailItem}>
                                    <label style={styles.detailLabel}>Email</label>
                                    <span style={styles.detailValue}>{session.counselor_email}</span>
                                  </div>
                                  <div style={styles.detailItem}>
                                    <label style={styles.detailLabel}>Phone</label>
                                    <span style={styles.detailValue}>{session.counselor_phone}</span>
                                  </div>
                                  <div style={styles.detailItem}>
                                    <label style={styles.detailLabel}>Specialization</label>
                                    <span style={styles.detailValue}>{session.specialization}</span>
                                  </div>
                                  <div style={styles.detailItem}>
                                    <label style={styles.detailLabel}>Institution</label>
                                    <span style={styles.detailValue}>{session.current_institution}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Timestamps */}
                              <div style={styles.detailSection}>
                                <h3 style={styles.detailSectionTitle}>⏰ Timestamps</h3>
                                <div style={styles.detailGrid}>
                                  <div style={styles.detailItem}>
                                    <label style={styles.detailLabel}>Created At</label>
                                    <span style={styles.detailValue}>{formatDate(session.created_at)}</span>
                                  </div>
                                  <div style={styles.detailItem}>
                                    <label style={styles.detailLabel}>Updated At</label>
                                    <span style={styles.detailValue}>{formatDate(session.updated_at)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {sessionData.length > 0 && (
              <div style={styles.paginationContainer}>
                <button
                  style={styles.paginationButton}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span style={styles.paginationInfo}>
                  Page {currentPage} of {Math.ceil(pagination.total / limit)}
                </span>
                <button
                  style={styles.paginationButton}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasMore}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f8fafc',
  },
  mainContent: {
    flex: 1,
    transition: 'margin-left 0.3s ease',
  },
  content: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    borderRadius: '16px',
    padding: '32px',
    marginBottom: '24px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e2e8f0',
    textAlign: 'center',
  },
  title: {
    margin: 0,
    fontSize: '2rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    margin: '8px 0 0 0',
    color: '#64748b',
    fontSize: '1rem',
  },
  errorMessage: {
    background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
    color: '#991b1b',
    padding: '16px 20px',
    borderRadius: '12px',
    borderLeft: '4px solid #ef4444',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 600,
  },
  filterContainer: {
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  filterLabel: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1e293b',
  },
  filterSelect: {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    background: '#ffffff',
    fontSize: '0.875rem',
    color: '#1e293b',
    cursor: 'pointer',
  },
  emptyMessage: {
    textAlign: 'center',
    padding: '20px',
    color: '#64748b',
    fontSize: '1rem',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    color: '#64748b',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  tableContainer: {
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    color: 'white',
    padding: '20px 16px',
    textAlign: 'left',
    fontSize: '0.875rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tr: {
    borderBottom: '1px solid #e2e8f0',
    transition: 'background-color 0.2s',
    cursor: 'pointer',
  },
  expandedRowBg: {
    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
  },
  td: {
    padding: '20px 16px',
    verticalAlign: 'middle',
  },
  nameCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #e2e8f0',
  },
  avatarPlaceholder: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    fontWeight: 700,
  },
  idText: {
    color: '#1e293b',
    fontWeight: 600,
    fontSize: '0.875rem',
  },
  nameText: {
    fontWeight: 600,
    color: '#1e293b',
    fontSize: '1rem',
  },
  emailText: {
    fontSize: '0.875rem',
    color: '#64748b',
  },
  ageText: {
    fontWeight: 600,
    color: '#1e293b',
  },
  genderBadge: {
    padding: '6px 12px',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#1e293b',
  },
  districtText: {
    color: '#64748b',
    fontSize: '1.2rem',
  },
  statusBadge: {
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statusActive: {
    background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
    color: '#065f46',
  },
  statusCompleted: {
    background: 'linear-gradient(135deg, #d9f99d 0%, #bef264 100%)',
    color: '#365314',
  },
  statusInactive: {
    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
    color: '#991b1b',
  },
  expandBtn: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  detailsRow: {
    background: '#f8fafc',
  },
  detailsTd: {
    padding: 0,
  },
  expandedContent: {
    padding: '32px',
  },
  detailsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  detailSection: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  detailSectionTitle: {
    margin: '0 0 20px 0',
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#1e293b',
    paddingBottom: '12px',
    borderBottom: '2px solid #e2e8f0',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  detailLabel: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  detailValue: {
    fontSize: '1rem',
    color: '#1e293b',
    fontWeight: 500,
    padding: '12px',
    background: '#f8fafc',
    borderRadius: '8px',
  },
  medicalValue: {
    fontSize: '1rem',
    color: '#1e293b',
    fontWeight: 400,
    padding: '16px',
    background: '#fef9e7',
    borderRadius: '8px',
    border: '1px solid #fde68a',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '16px',
    gap: '12px',
  },
  paginationButton: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    opacity: 0.7,
  },
  paginationInfo: {
    fontSize: '1rem',
    color: '#1e293b',
    fontWeight: 500,
  },
};

export default AppointmentDetails;