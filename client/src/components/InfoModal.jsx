import React from 'react';
import './InfoModal.css';

const InfoModal = ({ isOpen, onClose, title, message, icon = "ℹ️" }) => {
  if (!isOpen) return null;

  return (
    <div className="info-modal-overlay" onClick={onClose}>
      <div className="info-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="info-modal-icon">{icon}</div>
        <h2 className="info-modal-title">{title}</h2>
        <p className="info-modal-message">{message}</p>
        <button className="info-modal-close-btn" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
};

export default InfoModal;
