const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const counselorElderChatApi = {
  // Get elders with appointments for a counselor
  getEldersWithAppointments: async (counselorId) => {
    try {
      console.log('API: Fetching elders with appointments for counselor:', counselorId);
      
      const response = await fetch(`${API_BASE}/healthprofessional/${counselorId}/elders-with-appointments`);
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch elders with appointments');
      }
      
      return data;
    } catch (error) {
      console.error('Error in getEldersWithAppointments:', error);
      throw error;
    }
  },

  // Get appointment history between counselor and elder
  getAppointmentHistoryWithElder: async (counselorId, elderId) => {
    try {
      console.log('API: Fetching appointment history between counselor and elder:', {
        counselorId,
        elderId
      });
      
      const response = await fetch(`${API_BASE}/healthprofessional/${counselorId}/elder/${elderId}/appointments`);
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch appointment history');
      }
      
      return data;
    } catch (error) {
      console.error('Error in getAppointmentHistoryWithElder:', error);
      throw error;
    }
  }
};
