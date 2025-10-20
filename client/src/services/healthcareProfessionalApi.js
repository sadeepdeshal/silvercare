const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const healthcareProfessionalApi = {
  // Get healthcare professionals who have appointments with family member's elders
  getHealthcareProfessionalsWithAppointments: async (familyUserId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/healthcare-professionals-with-appointments/${familyUserId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching healthcare professionals with appointments:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch healthcare professionals',
        healthcareProfessionals: []
      };
    }
  },

  // Get all approved healthcare professionals (if needed for general chat)
  getAllApprovedHealthcareProfessionals: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/healthprofessional/approved`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching approved healthcare professionals:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch healthcare professionals',
        healthcareProfessionals: []
      };
    }
  },

  // Get healthcare professional details by user_id
  getHealthcareProfessionalByUserId: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/healthprofessional/by-user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching healthcare professional by user ID:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch healthcare professional details',
        healthcareProfessional: null
      };
    }
  }
};