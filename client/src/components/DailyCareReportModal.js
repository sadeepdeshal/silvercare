import React, { useState, useEffect } from 'react';
import styles from './css/DailyCareReportModal.module.css';

const DailyCareReportModal = ({ isOpen, onClose, onSubmit, elderName, reportDate, existingReport, isSubmitting, isReadOnly = false, isCarelogMode = false }) => {
  const [formData, setFormData] = useState({
    notes: existingReport?.notes || '',
    mood: existingReport?.mood || 'good',
    health_status: existingReport?.health_status || 'stable',
    medications: existingReport?.medications || '',
    activities: existingReport?.activities || '',
    concerns: existingReport?.concerns || ''
  });

  // Reset form data when modal opens or existing report changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        notes: existingReport?.notes || '',
        mood: existingReport?.mood || 'good',
        health_status: existingReport?.health_status || 'stable',
        medications: existingReport?.medications || '',
        activities: existingReport?.activities || '',
        concerns: existingReport?.concerns || ''
      });
    }
  }, [isOpen, existingReport]);

  const handleChange = (e) => {
    // Prevent changes in read-only mode
    if (isReadOnly) return;
    
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prevent submission in read-only mode
    if (isReadOnly) {
      alert('This report cannot be edited as it is from a past date.');
      return;
    }
    
    onSubmit(formData);
  };

  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <div className={styles.iconContainer}>
              <span className={styles.reportIcon}>📋</span>
            </div>
            <div className={styles.titleSection}>
              <h2 className={styles.modalTitle}>
                Daily Care Report {isReadOnly && <span style={{color: '#dc2626', fontSize: '0.8em'}}>(Read Only)</span>}
              </h2>
              <p className={styles.modalSubtitle}>
                For {elderName} • {formatDate(reportDate)}
                {isReadOnly && <span style={{color: '#dc2626', fontSize: '0.9em', display: 'block', marginTop: '4px'}}>
                  ⚠️ This report is from a past date and cannot be edited
                </span>}
              </p>
            </div>
          </div>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.reportForm}>
          <div className={styles.formSections}>
            
            {/* General Notes Section */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>📝</span>
                <h3 className={styles.sectionTitle}>General Notes</h3>
              </div>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder={isReadOnly ? "View submitted notes..." : "Describe the overall care activities, observations, and notable events from today..."}
                rows={4}
                className={styles.textarea}
                required={!isReadOnly}
                disabled={isReadOnly}
                readOnly={isReadOnly}
                style={{
                  backgroundColor: isReadOnly ? '#f8f9fa' : '',
                  cursor: isReadOnly ? 'default' : 'text',
                  opacity: isReadOnly ? 0.8 : 1
                }}
              />
            </div>

            {/* Mood & Well-being Section */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>😊</span>
                <h3 className={styles.sectionTitle}>Mood & Well-being</h3>
              </div>
              <select
                name="mood"
                value={formData.mood}
                onChange={handleChange}
                className={styles.select}
                disabled={isReadOnly}
                style={{
                  backgroundColor: isReadOnly ? '#f8f9fa' : '',
                  cursor: isReadOnly ? 'default' : 'pointer',
                  opacity: isReadOnly ? 0.8 : 1
                }}
              >
                <option value="excellent">😄 Excellent - Very happy and energetic</option>
                <option value="good">😊 Good - Positive and comfortable</option>
                <option value="neutral">😐 Neutral - Stable, no concerns</option>
                <option value="low">😔 Low - Somewhat withdrawn or quiet</option>
                <option value="poor">😞 Poor - Distressed or agitated</option>
              </select>
            </div>

            {/* Health Status Section */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>🏥</span>
                <h3 className={styles.sectionTitle}>Health Status</h3>
              </div>
              <select
                name="health_status"
                value={formData.health_status}
                onChange={handleChange}
                className={styles.select}
                disabled={isReadOnly}
                style={{
                  backgroundColor: isReadOnly ? '#f8f9fa' : '',
                  cursor: isReadOnly ? 'default' : 'pointer',
                  opacity: isReadOnly ? 0.8 : 1
                }}
              >
                <option value="excellent">💪 Excellent - No health concerns</option>
                <option value="stable">✅ Stable - Normal condition maintained</option>
                <option value="improving">📈 Improving - Getting better</option>
                <option value="declining">📉 Declining - Some deterioration noted</option>
                <option value="concerning">⚠️ Concerning - Requires attention</option>
                <option value="critical">🚨 Critical - Immediate care needed</option>
              </select>
            </div>

            {/* Medications Section */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>💊</span>
                <h3 className={styles.sectionTitle}>Medications & Treatments</h3>
              </div>
              <textarea
                name="medications"
                value={formData.medications}
                onChange={handleChange}
                placeholder={isReadOnly ? "View medication details..." : "List medications given, dosages, times, and any treatments administered..."}
                rows={3}
                className={styles.textarea}
                disabled={isReadOnly}
                readOnly={isReadOnly}
                style={{
                  backgroundColor: isReadOnly ? '#f8f9fa' : '',
                  cursor: isReadOnly ? 'default' : 'text',
                  opacity: isReadOnly ? 0.8 : 1
                }}
              />
            </div>

            {/* Activities Section */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>🎯</span>
                <h3 className={styles.sectionTitle}>Daily Activities</h3>
              </div>
              <textarea
                name="activities"
                value={formData.activities}
                onChange={handleChange}
                placeholder={isReadOnly ? "View daily activities..." : "Describe activities participated in, exercise, social interactions, meals, etc..."}
                rows={3}
                className={styles.textarea}
                disabled={isReadOnly}
                readOnly={isReadOnly}
                style={{
                  backgroundColor: isReadOnly ? '#f8f9fa' : '',
                  cursor: isReadOnly ? 'default' : 'text',
                  opacity: isReadOnly ? 0.8 : 1
                }}
              />
            </div>

            {/* Concerns Section */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>⚠️</span>
                <h3 className={styles.sectionTitle}>Concerns & Follow-ups</h3>
              </div>
              <textarea
                name="concerns"
                value={formData.concerns}
                onChange={handleChange}
                placeholder={isReadOnly ? "View concerns and follow-ups..." : "Note any concerns, issues that need follow-up, or recommendations for future care..."}
                rows={3}
                className={styles.textarea}
                disabled={isReadOnly}
                readOnly={isReadOnly}
                style={{
                  backgroundColor: isReadOnly ? '#f8f9fa' : '',
                  cursor: isReadOnly ? 'default' : 'text',
                  opacity: isReadOnly ? 0.8 : 1
                }}
              />
            </div>

          </div>

          <div className={styles.formActions}>
            <button 
              type="button" 
              onClick={onClose}
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              {isReadOnly ? 'Close' : 'Cancel'}
            </button>
            {!isReadOnly && (
              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className={styles.loadingContent}>
                    <span className={styles.spinner}></span>
                    Submitting...
                  </span>
                ) : (
                  <span className={styles.submitContent}>
                    <span className={styles.submitIcon}>📤</span>
                    Submit Report
                  </span>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default DailyCareReportModal;
