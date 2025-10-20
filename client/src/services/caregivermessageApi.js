const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const caregivermessageApi = {
  // Get caregivers assigned to family member's elders
  getCaregiversWithAssignments: async (familyMemberId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/caregiver-messages/caregivers/${familyMemberId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch caregivers');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching caregivers with assignments:', error);
      throw error;
    }
  },

  // Get family members for a caregiver
  getFamilyMembersForCaregiver: async (caregiverId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/caregiver-messages/family-members/${caregiverId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch family members');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching family members for caregiver:', error);
      throw error;
    }
  },

  // Get care assignment details
  getCareAssignmentDetails: async (familyMemberId, caregiverId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/caregiver-messages/assignments/${familyMemberId}/${caregiverId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch assignment details');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching care assignment details:', error);
      throw error;
    }
  }
};