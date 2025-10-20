const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const doctorElderChatApi = {
  // Get elders who have confirmed/completed appointments with this doctor
  getEldersWithAppointments: async (doctorId) => {
    try {
      console.log('API: Fetching elders with appointments for doctor:', doctorId);
      
      const response = await fetch(`${API_BASE}/doctor/${doctorId}/elders-with-appointments`);
      const data = await response.json();
      
      console.log('API: Elders with appointments response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch elders with appointments');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error fetching elders with appointments:', error);
      throw error;
    }
  },

  // Get appointment history between doctor and specific elder
  getAppointmentHistoryWithElder: async (doctorId, elderId) => {
    try {
      console.log('API: Fetching appointment history for doctor:', doctorId, 'and elder:', elderId);
      
      const response = await fetch(`${API_BASE}/doctor/${doctorId}/elder/${elderId}/appointments`);
      const data = await response.json();
      
      console.log('API: Appointment history response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch appointment history');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error fetching appointment history:', error);
      throw error;
    }
  }
};
