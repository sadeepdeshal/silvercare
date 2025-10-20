const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const elderDoctorChatApi = {
  // Get doctors who have confirmed/completed appointments with this elder
  getDoctorsWithAppointments: async (elderId) => {
    try {
      console.log('API: Fetching doctors with appointments for elder:', elderId);
      
      const response = await fetch(`${API_BASE}/elders/${elderId}/doctors-with-appointments`);
      const data = await response.json();
      
      console.log('API: Doctors with appointments response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch doctors with appointments');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error fetching doctors with appointments:', error);
      throw error;
    }
  },

  // Get appointment history between elder and specific doctor
  getAppointmentHistoryWithDoctor: async (elderId, doctorId) => {
    try {
      console.log('API: Fetching appointment history for elder:', elderId, 'and doctor:', doctorId);
      
      const response = await fetch(`${API_BASE}/elders/${elderId}/doctor/${doctorId}/appointments`);
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
