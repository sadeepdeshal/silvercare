const API_BASE = 'http://localhost:5000/api/appointments';

export const appointmentApi = {
  // Get all appointments for a family member
  getAllAppointmentsByFamily: async (familyMemberId, filters = {}) => {
    try {
      console.log('API: Fetching all appointments for family member:', familyMemberId, 'with filters:', filters);
      
      const queryParams = new URLSearchParams();
      if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.type && filters.type !== 'all') queryParams.append('type', filters.type);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.offset) queryParams.append('offset', filters.offset);
      
      const url = `${API_BASE}/family-member/${familyMemberId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('API: All appointments response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch appointments');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error fetching all appointments:', error);
      throw error;
    }
  },

  // Get appointment by ID
  getAppointmentById: async (appointmentId) => {
    try {
      console.log('API: Fetching appointment by ID:', appointmentId);
      const response = await fetch(`${API_BASE}/${appointmentId}`);
      const data = await response.json();
      
      console.log('API: Appointment details response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch appointment details');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error fetching appointment details:', error);
      throw error;
    }
  },

  // Update appointment status
  updateAppointmentStatus: async (appointmentId, status, notes = null) => {
    try {
      console.log('API: Updating appointment status:', appointmentId, status);
      const response = await fetch(`${API_BASE}/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes }),
      });
      
      const data = await response.json();
      console.log('API: Update status response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update appointment status');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error updating appointment status:', error);
      throw error;
    }
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId, reason = null) => {
    try {
      console.log('API: Cancelling appointment:', appointmentId, reason);
      const response = await fetch(`${API_BASE}/${appointmentId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      
      const data = await response.json();
      console.log('API: Cancel appointment response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel appointment');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error cancelling appointment:', error);
      throw error;
    }
  },

  // Get appointment statistics
  getAppointmentStats: async (familyMemberId) => {
    try {
      console.log('API: Fetching appointment stats for family member:', familyMemberId);
      const response = await fetch(`${API_BASE}/family-member/${familyMemberId}/stats`);
      const data = await response.json();
      
      console.log('API: Appointment stats response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch appointment statistics');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error fetching appointment stats:', error);
      throw error;
    }
  }
};
