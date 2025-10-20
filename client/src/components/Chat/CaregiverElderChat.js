import React, { useState, useEffect, useRef } from 'react';
import { caregiverElderMessageApi } from '../../services/caregiverElderMessageApi';
import styles from '../css/caregiverElder/CaregiverElderChat.module.css';

const CaregiverElderChat = ({ 
  caregiverId, 
  elderUserId, 
  currentUserRole, 
  currentUserId,
  onBack 
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignmentDetails, setAssignmentDetails] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom when messages change - with delay like FamilyChat
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [messages.length]); // Only scroll when message count changes

  useEffect(() => {
    // Initial load with loading spinner
    fetchMessages(false);
    fetchAssignmentDetails();
    
    // Background polling every 5 seconds - invisible to user
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [caregiverId, elderUserId]);

  const fetchMessages = async (isBackgroundRefresh = false) => {
    if (!caregiverId || !elderUserId) return;

    try {
      // Only show loading spinner on initial load, not on background refreshes
      if (!isBackgroundRefresh) {
        setLoading(true);
      }

      const response = await caregiverElderMessageApi.getMessages(caregiverId, elderUserId);
      if (response.success) {
        setMessages(response.messages);
      }
    } catch (error) {
      // Only log errors on initial load, silent on background refreshes
      if (!isBackgroundRefresh) {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages');
      }
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
    }
  };

  const fetchAssignmentDetails = async () => {
    try {
      const response = await caregiverElderMessageApi.getCareAssignmentDetails(caregiverId, elderUserId);
      if (response.success) {
        setAssignmentDetails(response.assignments[0] || null);
      }
    } catch (error) {
      console.error('Error fetching assignment details:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageToSend = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      setSending(true);
      
      const messageData = {
        message: messageToSend,
        senderType: currentUserRole // 'caregiver' or 'elder'
      };

      const response = await caregiverElderMessageApi.sendMessage(caregiverId, elderUserId, messageData);
      
      if (response.success) {
        // Immediately add the message to local state for instant feedback
        const newMsg = {
          message_id: response.message_id || Date.now(),
          sender_type: currentUserRole,
          message: messageToSend,
          timestamp: new Date().toISOString(),
          caregiver_name: currentUserRole === 'caregiver' ? 'You' : null,
          elder_name: currentUserRole === 'elder' ? 'You' : null
        };
        setMessages(prev => [...prev, newMsg]);
      } else {
        // Restore message if send failed
        setNewMessage(messageToSend);
        setError('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message if send failed
      setNewMessage(messageToSend);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Format timestamp for time only
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date for date headers
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Group messages by date like FamilyChat
  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
      const date = new Date(message.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  const isCurrentUserMessage = (message) => {
    if (currentUserRole === 'caregiver') {
      return message.sender_type === 'caregiver';
    } else {
      return message.sender_type === 'elder';
    }
  };

  // Show loading only when initially loading and no messages exist
  if (loading && messages.length === 0) {
    return (
      <div className={styles.chatContainer}>
        <div className={styles.chatHeader}>
          <div className={styles.chatHeaderInfo}>
            <h3>Loading Chat...</h3>
          </div>
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderInfo}>
          <h3>
            {currentUserRole === 'caregiver' 
              ? `💬 ${assignmentDetails?.elder_name_user || 'Elder'}`
              : `💬 ${assignmentDetails?.caregiver_name || 'Caregiver'}`
            }
          </h3>
          {assignmentDetails && (
            <span className={styles.assignmentInfo}>
              Care Assignment: {assignmentDetails.assignment_status} 
              {assignmentDetails.start_date && (
                <span> • Started {new Date(assignmentDetails.start_date).toLocaleDateString()}</span>
              )}
            </span>
          )}
        </div>
      </div>

      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.noMessages}>
            <div className={styles.noMessagesIcon}>💬</div>
            <h4>Start Your Conversation</h4>
            <p>Send a message to begin chatting!</p>
          </div>
        ) : (
          (() => {
            const groupedMessages = groupMessagesByDate(messages);
            return Object.entries(groupedMessages).map(([date, dayMessages]) => (
              <div key={date}>
                <div className={styles.dateHeader}>
                  <span>{formatDate(dayMessages[0].timestamp)}</span>
                </div>
                {dayMessages.map((message, index) => (
                  <div
                    key={message.message_id || index}
                    className={`${styles.messageItem} ${
                      isCurrentUserMessage(message) ? styles.sentMessage : styles.receivedMessage
                    }`}
                  >
                    <div className={styles.messageContent}>
                      <p>{message.message}</p>
                      <span className={styles.messageTime}>
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ));
          })()
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className={styles.messageForm} onSubmit={handleSendMessage}>
        <div className={styles.inputContainer}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className={styles.messageInput}
            disabled={sending}
            maxLength={1000}
          />
          <button
            type="submit"
            className={styles.sendButton}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? '⏳' : '➤'}
          </button>
        </div>
      </form>

      {error && (
        <div className={styles.errorMessage}>
          {error}
          <button onClick={() => setError(null)} className={styles.closeError}>×</button>
        </div>
      )}
    </div>
  );
};

export default CaregiverElderChat;