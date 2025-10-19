import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get family member details by user ID
export const getFamilyMemberDetails = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE}/family-member/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching family member details:', error);
    throw error;
  }
};

// Update family member details
export const updateFamilyMemberDetails = async (userId, updateData) => {
  try {
    const response = await axios.put(`${API_BASE}/family-member/${userId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating family member details:', error);
    throw error;
  }
};

// New functions for healthcare professional chat
export const familyMemberApi = {
  // Get family members who have elders that have appointments with this healthcare professional
  getFamilyMembersWithAppointments: async (healthcareProfessionalUserId) => {
    try {
      const response = await axios.get(`${API_BASE}/messages/family-members-with-appointments/${healthcareProfessionalUserId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching family members with appointments:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch family members',
        familyMembers: []
      };
    }
  },

  // Get family member details by user_id
  getFamilyMemberByUserId: async (userId) => {
    try {
      const response = await axios.get(`${API_BASE}/family-member/by-user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching family member by user ID:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch family member details',
        familyMember: null
      };
    }
  },

  // Get carelog data for specific elder and date
  getElderCarelogByDate: async (userId, elderId, date) => {
    try {
      const response = await axios.get(`${API_BASE}/family-member/${userId}/elder/${elderId}/carelog`, {
        params: { date }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching carelog data:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch carelog data',
        carelogs: []
      };
    }
  },

  // Get carelog status for date range (for calendar display)
  getElderCarelogStatus: async (userId, elderId, startDate, endDate) => {
    try {
      const response = await axios.get(`${API_BASE}/family-member/${userId}/elder/${elderId}/carelog-status`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching carelog status:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch carelog status',
        carelogStatus: []
      };
    }
  },

  // Get upcoming sessions for family member's elders
  getUpcomingSessions: async (userId) => {
    try {
      const response = await axios.get(`${API_BASE}/family-member/${userId}/sessions/upcoming`);
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch upcoming sessions',
        sessions: [],
        count: 0
      };
    }
  },

  // Get upcoming care visits for family member's elders
  getUpcomingCareVisits: async (userId) => {
    try {
      const response = await axios.get(`${API_BASE}/family-member/${userId}/care-visits/upcoming`);
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming care visits:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch upcoming care visits',
        careVisits: [],
        count: 0
      };
    }
  }
};
