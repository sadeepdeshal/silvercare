import React, { useState, useEffect, useRef } from 'react';
import { messagesApi } from '../../services/messagesApi';
import styles from './CounselorElderChat.module.css';

const CounselorElderChat = ({ currentUser, selectedElder, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    // Small delay to ensure DOM is updated before scrolling
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [messages.length]); // Only scroll when message count changes, not on every message update

  // Fetch messages between counselor and elder
  const fetchMessages = async (isBackgroundRefresh = false) => {
    if (!currentUser?.user_id || !selectedElder?.elder_id) {
      console.log('Missing user IDs:', {
        currentUser: currentUser?.user_id,
        selectedElder: selectedElder?.elder_id
      });
      return;
    }
    
    try {
      // Only show loading spinner on initial load, not on background refreshes
      if (!isBackgroundRefresh) {
        setLoading(true);
      }
      
      console.log('Fetching messages between:', {
        counselor: currentUser.user_id,
        elder: selectedElder.elder_id
      });
      
      const response = await messagesApi.getConversation(
        currentUser.user_id,
        selectedElder.elder_id
      );

      if (response.success) {
        setMessages(response.messages);
        
        // Mark messages as read only if there are new unread messages
        const hasUnreadMessages = response.messages.some(
          msg => msg.receiver_id === currentUser.user_id && !msg.is_read
        );
        if (hasUnreadMessages) {
          await messagesApi.markAsRead(selectedElder.elder_id, currentUser.user_id);
        }
      }
    } catch (err) {
      // Only log errors on initial load, silent on background refreshes
      if (!isBackgroundRefresh) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages');
      }
    } finally {
      // Only hide loading spinner if it was shown
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    const messageToSend = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      setLoading(true);
      setError(null);

      console.log('Sending message:', {
        from: currentUser.user_id,
        to: selectedElder.elder_id,
        senderType: 'healthprofessional',
        receiverType: 'elder',
        message: messageToSend
      });

      const response = await messagesApi.sendMessage(
        currentUser.user_id,
        selectedElder.elder_id,
        'healthprofessional',
        'elder',
        messageToSend
      );

      if (response.success) {
        // Immediately add the message to local state for instant feedback
        const newMsg = {
          message_id: response.message_id,
          sender_id: currentUser.user_id,
          receiver_id: selectedElder.elder_id,
          sender_type: 'healthprofessional',
          receiver_type: 'elder',
          message_text: messageToSend,
          sent_at: new Date().toISOString(),
          is_read: false,
          sender_name: currentUser.name
        };
        setMessages(prev => [...prev, newMsg]);
      } else {
        // Restore message if send failed
        setNewMessage(messageToSend);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      // Restore message if send failed
      setNewMessage(messageToSend);
    } finally {
      setLoading(false);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async () => {
    if (!currentUser?.user_id || !selectedElder?.elder_id) return;
    
    try {
      await messagesApi.markAsRead(selectedElder.elder_id, currentUser.user_id);
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    if (currentUser && selectedElder) {
      // Initial load with loading spinner
      fetchMessages(false);
      markMessagesAsRead();
      
      // Background polling every 5 seconds - completely invisible to user
      const interval = setInterval(() => {
        // Background refresh - no loading spinners or error messages
        fetchMessages(true);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [currentUser?.user_id, selectedElder?.elder_id]); // Only re-run if user/elder changes

  // Mark as read when component mounts
  useEffect(() => {
    markMessagesAsRead();
  }, [currentUser, selectedElder]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
      const date = new Date(message.sent_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  if (!selectedElder) {
    return <div className={styles.noSelection}>Select an elder to start chatting</div>;
  }

  if (loading && messages.length === 0) {
    return (
      <div className={styles.chatContainer}>
        <div className={styles.chatHeader}>
          <h3>💬 Chat with {selectedElder.elder_name}</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <div className={styles.elderInfo}>
          <div className={styles.elderAvatar}>
            {selectedElder.profile_photo ? (
              <img 
                src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/profiles/${selectedElder.profile_photo}`}
                alt={selectedElder.elder_name}
                className={styles.avatarImage}
              />
            ) : (
              <span className={styles.avatarPlaceholder}>👴</span>
            )}
          </div>
          <div className={styles.elderDetails}>
            <h3 className={styles.elderName}>{selectedElder.elder_name}</h3>
            <div className={styles.elderMeta}>
              <span className={styles.elderAge}>{selectedElder.age} years</span>
              <span className={styles.elderGender}>{selectedElder.gender}</span>
              <span className={styles.elderDistrict}>{selectedElder.elder_district}</span>
            </div>
            {selectedElder.medical_conditions && (
              <div className={styles.medicalConditions}>
                <strong>Medical Conditions:</strong> {selectedElder.medical_conditions}
              </div>
            )}
          </div>
        </div>
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>
      </div>

      <div className={styles.messagesContainer}>
        {error && (
          <div className={styles.errorMessage}>
            <span className={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        <div className={styles.messagesList}>
          {messages.length === 0 ? (
            <div className={styles.noMessages}>
              <div className={styles.noMessagesIcon}>💬</div>
              <h4>No messages yet</h4>
              <p>Start the conversation with {selectedElder.elder_name}</p>
            </div>
          ) : (
            Object.entries(groupMessagesByDate(messages)).map(([date, dayMessages]) => (
              <div key={date}>
                <div className={styles.dateHeader}>
                  <span>{formatDate(dayMessages[0].sent_at)}</span>
                </div>
                {dayMessages.map((message) => (
                  <div
                    key={message.message_id}
                    className={`${styles.messageItem} ${
                      message.sender_id === currentUser.user_id
                        ? styles.sentMessage
                        : styles.receivedMessage
                    }`}
                  >
                    <div className={styles.messageContent}>
                      <div className={styles.messageText}>{message.message_text}</div>
                      <div className={styles.messageTime}>
                        {formatTime(message.sent_at)}
                        {message.sender_id === currentUser.user_id && (
                          <span className={styles.readStatus}>
                            {message.is_read ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form className={styles.messageForm} onSubmit={handleSendMessage}>
        <div className={styles.messageInputContainer}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Type a message to ${selectedElder.elder_name}...`}
            className={styles.messageInput}
            disabled={loading}
          />
          <button 
            type="submit" 
            className={styles.sendButton}
            disabled={!newMessage.trim() || loading}
          >
            {loading ? '⏳' : '📤'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CounselorElderChat;
