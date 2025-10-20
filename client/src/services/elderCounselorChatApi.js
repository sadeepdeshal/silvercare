const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const elderCounselorChatApi = {
  // Get counselors with appointments for an elder
  getCounselorsWithAppointments: async (elderId) => {
    try {
      console.log('API: Fetching counselors with appointments for elder:', elderId);
      
      const response = await fetch(`${API_BASE}/elders/${elderId}/counselors-with-appointments`);
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch counselors with appointments');
      }
      
      return data;
    } catch (error) {
      console.error('Error in getCounselorsWithAppointments:', error);
      throw error;
    }
  },

  // Get appointment history between elder and counselor
  getAppointmentHistoryWithCounselor: async (elderId, counselorId) => {
    try {
      console.log('API: Fetching appointment history between elder and counselor:', {
        elderId,
        counselorId
      });
      
      const response = await fetch(`${API_BASE}/elders/${elderId}/counselor/${counselorId}/appointments`);
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch appointment history');
      }
      
      return data;
    } catch (error) {
      console.error('Error in getAppointmentHistoryWithCounselor:', error);
      throw error;
    }
  }
};
