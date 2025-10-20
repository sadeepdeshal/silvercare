import React, { useState, useEffect, useRef } from 'react';
import { caregiverElderMessageApi } from '../../services/caregiverElderMessageApi';
import styles from './ElderChatForCaregiver.module.css';

const ElderChatForCaregiver = ({ currentUser, selectedElder, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch conversation messages
  const fetchMessages = async (isBackgroundRefresh = false) => {
    if (!currentUser?.caregiver_id || !selectedElder?.elder_id) {
      console.log('Missing IDs in ElderChatForCaregiver.js:', {
        currentUser: currentUser?.caregiver_id,
        selectedElder_id: selectedElder?.elder_id,
        selectedElderObject: selectedElder
      });
      return;
    }

    try {
      // Only show loading spinner on initial load, not on background refreshes
      if (!isBackgroundRefresh) {
        setLoading(true);
      }
      
      console.log('ElderChatForCaregiver.js - Fetching messages between:', {
        caregiver: currentUser.caregiver_id,
        elder: selectedElder.elder_id
      });
      
      const response = await caregiverElderMessageApi.getMessages(
        currentUser.caregiver_id,
        selectedElder.elder_id
      );

      if (response.success) {
        // Always update messages silently - no comparison needed
        setMessages(response.messages);
        
        // Scroll to bottom after updating messages
        setTimeout(scrollToBottom, 100);
      } else {
        console.error('Failed to fetch messages:', response.message);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
    }
  };

  // Send message function
  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    if (!currentUser?.caregiver_id || !selectedElder?.elder_id) {
      console.error('Missing user information for sending message');
      return;
    }

    try {
      setSending(true);
      
      const messageData = {
        message: newMessage.trim(),
        senderType: 'caregiver'
      };

      console.log('ElderChatForCaregiver.js - Sending message:', {
        caregiver: currentUser.caregiver_id,
        elder: selectedElder.elder_id,
        messageData
      });

      const response = await caregiverElderMessageApi.sendMessage(
        currentUser.caregiver_id,
        selectedElder.elder_id,
        messageData
      );

      if (response.success) {
        setNewMessage('');
        // Fetch messages immediately after sending
        fetchMessages(true);
      } else {
        console.error('Failed to send message:', response.message);
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Handle enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  // Determine if message is from current user
  const isCurrentUserMessage = (message) => {
    return message.sender_type === 'caregiver';
  };

  // Get sender display name
  const getSenderName = (message) => {
    if (isCurrentUserMessage(message)) {
      return 'You';
    }
    return message.elder_name || selectedElder?.elder_name || 'Elder';
  };

  // Initial fetch and setup polling
  useEffect(() => {
    if (selectedElder) {
      fetchMessages();
      
      // Set up polling every 5 seconds for new messages
      const interval = setInterval(() => {
        fetchMessages(true);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [selectedElder, currentUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!selectedElder) {
    return null;
  }

  return (
    <div className={styles.chatContainer}>
      {/* Chat Header */}
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderInfo}>
          <h3>{selectedElder.elder_name}</h3>
          <span className={styles.elderInfo}>
            Age: {selectedElder.age} • {selectedElder.district}
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className={styles.messagesContainer}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.noMessages}>
            <p>No messages yet. Start the conversation with {selectedElder.elder_name}!</p>
          </div>
        ) : (
          <div className={styles.messagesList}>
            {messages.map((message, index) => (
              <div
                key={message.message_id || index}
                className={`${styles.messageWrapper} ${
                  isCurrentUserMessage(message) ? styles.sent : styles.received
                }`}
              >
                <div className={styles.message}>
                  <div className={styles.messageContent}>
                    {message.message}
                  </div>
                  <div className={styles.messageMeta}>
                    <span className={styles.senderName}>
                      {getSenderName(message)}
                    </span>
                    <span className={styles.messageTime}>
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className={styles.messageInputContainer}>
        <div className={styles.inputWrapper}>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Type a message to ${selectedElder.elder_name}...`}
            className={styles.messageInput}
            disabled={sending}
            rows="1"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className={styles.sendButton}
          >
            {sending ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ElderChatForCaregiver;