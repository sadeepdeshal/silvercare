import React, { useState, useEffect } from 'react';
import './RequestCountdownTimer.css';

const RequestCountdownTimer = ({ requestDate, status }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // If status is not pending, don't show countdown
    if (status && status.toLowerCase() !== 'pending') {
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date();
      const requestTime = new Date(requestDate);
      const expiryTime = new Date(requestTime.getTime() + (10 * 60 * 60 * 1000)); // Add 10 hours

      const difference = expiryTime - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
      setIsExpired(false);
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const interval = setInterval(calculateTimeLeft, 1000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [requestDate, status]);

  // Don't render if status is not pending
  if (status && status.toLowerCase() !== 'pending') {
    if (status.toLowerCase() === 'approved') {
      return <div className="countdown-timer accepted">✅ Accepted</div>;
    }
    if (status.toLowerCase() === 'cancelled') {
      return <div className="countdown-timer cancelled">❌ Cancelled</div>;
    }
    if (status.toLowerCase() === 'completed') {
      return <div className="countdown-timer completed">✓ Completed</div>;
    }
    return null;
  }

  if (timeLeft === null) {
    return <div className="countdown-timer loading">Calculating...</div>;
  }

  if (isExpired) {
    return <div className="countdown-timer expired">⏰ EXPIRED</div>;
  }

  // Determine urgency class
  const totalHours = timeLeft.hours + (timeLeft.minutes / 60);
  let urgencyClass = 'safe';
  
  if (totalHours < 1) {
    urgencyClass = 'critical';
  } else if (totalHours < 3) {
    urgencyClass = 'warning';
  }

  // Calculate total hours including minutes as decimal
  const totalHoursRemaining = timeLeft.hours + (timeLeft.minutes / 60) + (timeLeft.seconds / 3600);
  const hoursDisplay = totalHoursRemaining.toFixed(1);

  return (
    <div className={`countdown-timer ${urgencyClass}`}>
      <span className="timer-icon">⏰</span>
      <span className="timer-text">
        {hoursDisplay}h remaining to accept
      </span>
    </div>
  );
};

export default RequestCountdownTimer;
