// carelogs.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar';
import styles from "../../components/css/caregiver/carelogs.module.css";
import CaregiverLayout from '../../components/CaregiverLayout';
import caregiverApi from '../../services/caregiverApi';
import { useAuth } from '../../context/AuthContext';

const Carelogs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [carelogs, setCarelogs] = useState([]);
  const [elders, setElders] = useState([]);
  const [selectedElder, setSelectedElder] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCarelog, setNewCarelog] = useState({
    elder_id: '',
    notes: '',
    mood: 'good'
  });

  useEffect(() => {
    if (!user || !user.caregiver_id) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const caregiverId = user.caregiver_id;
      
      const [carelogsData, eldersData] = await Promise.all([
        caregiverApi.getCarelogs(caregiverId), // Pass caregiverId parameter
        caregiverApi.fetchAssignedElders(caregiverId, newCarelog)
      ]);
      
      setCarelogs(carelogsData.carelogs || []); // Extract carelogs array from response
      setElders(eldersData.filter(elder => elder.status === 'approved' || elder.status === 'completed'));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCarelog = async (e) => {
    e.preventDefault();
    try {
      await caregiverApi.addCarelog(user.caregiver_id, newCarelog); // Pass caregiverId parameter
      setShowAddModal(false);
      setNewCarelog({ elder_id: '', notes: '', mood: 'good' });
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error adding carelog:', error);
      alert('Failed to add carelog. Please try again.');
    }
  };

  const filteredCarelogs = selectedElder === 'all' 
    ? carelogs 
    : carelogs.filter(log => log.elder_id === parseInt(selectedElder));

  const groupedCarelogs = filteredCarelogs.reduce((groups, log) => {
    const elderName = log.elder_name;
    if (!groups[elderName]) {
      groups[elderName] = [];
    }
    groups[elderName].push(log);
    return groups;
  }, {});

  if (loading) {
    return (
      <>
        <Navbar />
        <CaregiverLayout>
          <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 60, height: 60, border: '6px solid #e2e8f0', borderTop: '6px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 24 }} />
            <p style={{ color: '#667eea', fontSize: 20, fontWeight: 500 }}>Loading carelogs...</p>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        </CaregiverLayout>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <CaregiverLayout>
        <div className={styles.carelogsPage}>
          <div className={styles.header}>
            <div>
              <h1 style={{display: 'flex', alignItems: 'center', gap: 10, margin: 0}}>
                <span role="img" aria-label="Carelogs" style={{fontSize: '2.5rem'}}>�</span> 
                <span style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                  Care Reports
                </span>
              </h1>
              <p style={{color: '#718096', fontSize: '1rem', marginTop: '8px', marginLeft: '52px'}}>
                Track and document daily care activities
              </p>
            </div>
            <button 
              className={styles.addButton}
              onClick={() => setShowAddModal(true)}
            >
              <span role="img" aria-label="Add">✨</span> Add Report
            </button>
          </div>

          <div className={styles.filters}>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
              <span style={{fontSize: '1rem', fontWeight: 600, color: '#4a5568'}}>
                Filter by Elder:
              </span>
              <select 
                value={selectedElder} 
                onChange={(e) => setSelectedElder(e.target.value)}
                className={styles.elderFilter}
              >
                <option value="all">👥 All Elders</option>
                {elders.map(elder => (
                  <option key={elder.elder_id} value={elder.elder_id}>
                    👤 {elder.name}
                  </option>
                ))}
              </select>
            </div>
            {filteredCarelogs.length > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '8px 20px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}>
                <span>📊</span>
                {filteredCarelogs.length} Total Report{filteredCarelogs.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          <div className={styles.carelogsContainer}>
            {Object.keys(groupedCarelogs).length === 0 ? (
              <div className={styles.noCarelogs}>
                <div style={{
                  fontSize: '4rem',
                  marginBottom: '16px',
                  animation: 'bounce 2s infinite'
                }}>�</div>
                <span style={{color: '#667eea', fontWeight: 700, fontSize: '1.4rem', marginBottom: '8px'}}>
                  No Care Reports Yet
                </span>
                <span style={{color: '#718096', fontSize: '1rem', maxWidth: '400px', textAlign: 'center', lineHeight: '1.6'}}>
                  Start documenting care activities by adding your first care report. 
                  Track daily observations, moods, and important notes.
                </span>
                <button 
                  onClick={() => setShowAddModal(true)}
                  style={{
                    marginTop: '24px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 32px',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  ✨ Create First Report
                </button>
                <style>{`
                  @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                  }
                `}</style>
              </div>
            ) : (
              Object.entries(groupedCarelogs).map(([elderName, logs], idx) => (
                <div key={elderName} className={styles.elderSection} style={{
                  animation: `slideIn 0.5s ease ${idx * 0.1}s both`
                }}>
                  <div className={styles.elderHeader}>
                    <div style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.8rem',
                      fontWeight: 700,
                      color: 'white',
                      boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                      border: '4px solid white'
                    }}>
                      {elderName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className={styles.elderInfo}>
                      <h3 style={{
                        fontSize: '1.6rem',
                        margin: 0,
                        color: '#2b4c7e',
                        fontWeight: 700
                      }}>{elderName}</h3>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginTop: '6px'
                      }}>
                        <span style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                        }}>
                          📊 {logs.length} Report{logs.length !== 1 ? 's' : ''}
                        </span>
                        <span style={{
                          color: '#718096',
                          fontSize: '0.9rem',
                          fontWeight: 500
                        }}>
                          {logs[0] && `Latest: ${new Date(logs[0].date_logged).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.logsList}>
                    {logs.map((log, logIdx) => (
                      <div key={log.carelog_id} className={styles.logCard} style={{
                        animation: `fadeIn 0.5s ease ${logIdx * 0.05}s both`
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '16px'
                        }}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                            <div style={{
                              fontSize: '2.5rem',
                              background: log.mood === 'good' ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' :
                                         log.mood === 'neutral' ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' :
                                         'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                              width: '56px',
                              height: '56px',
                              borderRadius: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                            }}>
                              {log.mood === 'good' && '😊'}
                              {log.mood === 'neutral' && '😐'}
                              {log.mood === 'bad' && '😞'}
                            </div>
                            <div>
                              <span style={{
                                display: 'block',
                                fontSize: '0.85rem',
                                color: '#718096',
                                fontWeight: 500,
                                marginBottom: '4px'
                              }}>
                                📅 {new Date(log.date_logged).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                              <span style={{
                                display: 'block',
                                fontSize: '0.8rem',
                                color: '#a0aec0',
                                fontWeight: 500
                              }}>
                                🕐 {new Date(log.date_logged).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                          <span style={{
                            background: log.mood === 'good' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                                       log.mood === 'neutral' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
                                       'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: 'white',
                            padding: '6px 16px',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            {log.mood === 'good' && '😊 Good Mood'}
                            {log.mood === 'neutral' && '😐 Neutral'}
                            {log.mood === 'bad' && '😞 Bad Mood'}
                          </span>
                        </div>
                        <div style={{
                          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                          padding: '16px',
                          borderRadius: '12px',
                          border: '2px solid #e2e8f0',
                          marginTop: '12px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '10px',
                            color: '#4a5568',
                            fontSize: '0.9rem',
                            fontWeight: 600
                          }}>
                            <span>📝</span> Care Notes
                          </div>
                          <div style={{
                            color: '#2d3748',
                            fontSize: '1rem',
                            lineHeight: '1.8',
                            whiteSpace: 'pre-wrap',
                            fontWeight: 500
                          }}>
                            {log.notes}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <style>{`
                    @keyframes slideIn {
                      from {
                        opacity: 0;
                        transform: translateX(-20px);
                      }
                      to {
                        opacity: 1;
                        transform: translateX(0);
                      }
                    }
                    @keyframes fadeIn {
                      from {
                        opacity: 0;
                        transform: translateY(10px);
                      }
                      to {
                        opacity: 1;
                        transform: translateY(0);
                      }
                    }
                  `}</style>
                </div>
              ))
            )}
          </div>

          {/* Add Carelog Modal */}
          {showAddModal && (
            <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
              <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                  <h2>Add New Carelog</h2>
                  <button 
                    className={styles.closeButton}
                    onClick={() => setShowAddModal(false)}
                  >
                    ✕
                  </button>
                </div>
                
                <form onSubmit={handleAddCarelog} className={styles.modalForm}>
                  <div className={styles.formGroup}>
                    <label>Elder</label>
                    <select 
                      value={newCarelog.elder_id}
                      onChange={(e) => setNewCarelog({...newCarelog, elder_id: e.target.value})}
                      required
                    >
                      <option value="">Select Elder</option>
                      {elders.map(elder => (
                        <option key={elder.elder_id} value={elder.elder_id}>
                          {elder.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Mood</label>
                    <select 
                      value={newCarelog.mood}
                      onChange={(e) => setNewCarelog({...newCarelog, mood: e.target.value})}
                    >
                      <option value="good">😊 Good</option>
                      <option value="neutral">😐 Neutral</option>
                      <option value="bad">😞 Bad</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Notes</label>
                    <textarea 
                      value={newCarelog.notes}
                      onChange={(e) => setNewCarelog({...newCarelog, notes: e.target.value})}
                      placeholder="Describe the care activities, observations, or any important notes..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className={styles.modalActions}>
                    <button 
                      type="button" 
                      onClick={() => setShowAddModal(false)}
                      className={styles.cancelButton}
                    >
                      Cancel
                    </button>
                    <button type="submit" className={styles.submitButton}>
                      Add Carelog
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

export default Carelogs;
