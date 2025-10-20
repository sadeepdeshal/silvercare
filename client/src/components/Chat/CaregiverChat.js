import React, { useState, useEffect, useRef } from 'react';
import { messagesApi } from '../../services/messagesApi';
import styles from './CaregiverChat.module.css';

const CaregiverChat = ({ currentUser, selectedCaregiver, onClose }) => {
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
    if (!currentUser?.user_id || !selectedCaregiver?.user_id) {
      console.log('Missing user IDs in CaregiverChat.js:', {
        currentUser: currentUser?.user_id,
        selectedCaregiver_user_id: selectedCaregiver?.user_id,
        selectedCaregiver_caregiver_id: selectedCaregiver?.caregiver_id,
        selectedCaregiverObject: selectedCaregiver
      });
      return;
    }

    try {
      // Only show loading spinner on initial load, not on background refreshes
      if (!isBackgroundRefresh) {
        setLoading(true);
      }
      
      console.log('CaregiverChat.js - Fetching messages between:', {
        familyMember: currentUser.user_id,
        caregiver: selectedCaregiver.user_id
      });
      
      const response = await messagesApi.getConversation(
        currentUser.user_id,
        selectedCaregiver.user_id
      );

      if (response.success) {
        // Always update messages silently - no comparison needed
        setMessages(response.messages);
        
        // Mark messages as read only if there are new unread messages
        const hasUnreadMessages = response.messages.some(
          msg => msg.receiver_id === currentUser.user_id && !msg.is_read
        );
        if (hasUnreadMessages) {
          await messagesApi.markAsRead(selectedCaregiver.user_id, currentUser.user_id);
        }
      }
    } catch (error) {
      // Only log errors on initial load, silent on background refreshes
      if (!isBackgroundRefresh) {
        console.error('Error fetching messages:', error);
      }
    } finally {
      // Only hide loading spinner if it was shown
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
    }
  };

  // Send a new message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageToSend = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      setSending(true);
      
      console.log('CaregiverChat.js - Sending message:', {
        from: currentUser.user_id,
        to: selectedCaregiver.user_id,
        senderType: 'family_member',
        receiverType: 'caregiver',
        message: messageToSend,
        selectedCaregiverObject: selectedCaregiver
      });
      
      const response = await messagesApi.sendMessage(
        currentUser.user_id,
        selectedCaregiver.user_id,
        'family_member',
        'caregiver',
        messageToSend
      );

      if (response.success) {
        // Immediately add the message to local state for instant feedback
        const newMsg = {
          message_id: response.message_id,
          sender_id: currentUser.user_id,
          receiver_id: selectedCaregiver.user_id,
          sender_type: 'family_member',
          receiver_type: 'caregiver',
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
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message if send failed
      setNewMessage(messageToSend);
    } finally {
      setSending(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date
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

  // Initial load and polling for new messages
  useEffect(() => {
    // Initial load with loading spinner
    fetchMessages(false);
    
    // Background polling every 5 seconds - completely invisible to user
    const interval = setInterval(() => {
      // Background refresh - no loading spinners or error messages
      fetchMessages(true);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [currentUser?.user_id, selectedCaregiver?.user_id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    // Small delay to ensure DOM is updated before scrolling
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [messages.length]); // Only scroll when message count changes, not on every message update

  if (loading && messages.length === 0) {
    return (
      <div className={styles.chatContainer}>
        <div className={styles.chatHeader}>
          <h3>💬 Chat with {selectedCaregiver.caregiver_name}</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <div className={styles.caregiverInfo}>
          <h3>💬 {selectedCaregiver.caregiver_name}</h3>
          <div className={styles.caregiverMeta}>
            <span className={styles.district}>{selectedCaregiver.caregiver_district}</span>
            <span className={styles.availability}>{selectedCaregiver.availability}</span>
          </div>
        </div>
        <button className={styles.closeButton} onClick={onClose}>×</button>
      </div>

      <div className={styles.messagesContainer}>
        {Object.keys(groupedMessages).length === 0 ? (
          <div className={styles.noMessages}>
            <div className={styles.noMessagesIcon}>💬</div>
            <h4>Start Your Conversation</h4>
            <p>Send a message to {selectedCaregiver.caregiver_name}</p>
            <div className={styles.conversationStarters}>
              <h5>💡 Conversation starters:</h5>
              <div className={styles.starterButtons}>
                <button 
                  className={styles.starterButton}
                  onClick={() => setNewMessage("Hello! How is my elder doing today?")}
                >
                  "How is my elder doing today?"
                </button>
                <button 
                  className={styles.starterButton}
                  onClick={() => setNewMessage("I wanted to check on the care routine.")}
                >
                  "Check on care routine"
                </button>
                <button 
                  className={styles.starterButton}
                  onClick={() => setNewMessage("Is there anything I should know about their health?")}
                >
                  "Any health updates?"
                </button>
              </div>
            </div>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dayMessages]) => (
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
                    <p>{message.message_text}</p>
                    <span className={styles.messageTime}>
                      {formatTime(message.sent_at)}
                      {message.sender_id === currentUser.user_id && (
                        <span className={styles.readStatus}>
                          {message.is_read ? '✓✓' : '✓'}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className={styles.messageForm} onSubmit={sendMessage}>
        <div className={styles.inputContainer}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${selectedCaregiver.caregiver_name}...`}
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
    </div>
  );
};

export default CaregiverChat;