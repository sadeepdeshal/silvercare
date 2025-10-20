import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const caregiverElderMessageApi = {
  // Get elders assigned to a caregiver for messaging
  getEldersForCaregiver: async (caregiverId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/caregiver-elder-messages/caregiver/${caregiverId}/elders`);
      return response.data;
    } catch (error) {
      console.error('Error fetching elders for caregiver:', error);
      throw error;
    }
  },

  // Get caregivers assigned to an elder for messaging
  getCaregiversForElder: async (elderUserId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/caregiver-elder-messages/elder/${elderUserId}/caregivers`);
      return response.data;
    } catch (error) {
      console.error('Error fetching caregivers for elder:', error);
      throw error;
    }
  },

  // Get care assignment details between caregiver and elder
  getCareAssignmentDetails: async (caregiverId, elderUserId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/caregiver-elder-messages/caregiver/${caregiverId}/elder/${elderUserId}/assignment`);
      return response.data;
    } catch (error) {
      console.error('Error fetching care assignment details:', error);
      throw error;
    }
  },

  // Send message between caregiver and elder
  sendMessage: async (caregiverId, elderUserId, messageData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/caregiver-elder-messages/caregiver/${caregiverId}/elder/${elderUserId}/message`, messageData);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Get messages between caregiver and elder
  getMessages: async (caregiverId, elderUserId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/caregiver-elder-messages/caregiver/${caregiverId}/elder/${elderUserId}/messages`);
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }
};