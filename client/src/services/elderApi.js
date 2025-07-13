import axios from 'axios';
const API_BASE = 'http://localhost:5000/api/elders';

export const elderApi = {
  // Get all elders for a family member
  getEldersByFamilyMember: async (familyMemberId) => {
    try {
      console.log('API: Fetching elders for family member:', familyMemberId);
      const response = await fetch(`${API_BASE}/family-member/${familyMemberId}`);
      const data = await response.json();
      
      console.log('API: Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch elders');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error fetching elders:', error);
      throw error;
    }
  },

  // Get elder count for a family member
  getElderCount: async (familyMemberId) => {
    try {
      const response = await fetch(`${API_BASE}/count/${familyMemberId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch elder count');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching elder count:', error);
      throw error;
    }
  },

  // Get specific elder by ID
  getElderById: async (elderId) => {
    try {
      console.log('API: Fetching elder by ID:', elderId);
      const response = await fetch(`${API_BASE}/${elderId}`);
      const data = await response.json();
      
      console.log('API: Elder details response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch elder details');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error fetching elder details:', error);
      throw error;
    }
  },

  // Get doctors by elder's district for physical meetings
  getDoctorsByElderDistrict: async (elderId) => {
    try {
      console.log('API: Fetching doctors for elder ID:', elderId);
      const response = await fetch(`${API_BASE}/${elderId}/doctors`);
      const data = await response.json();
      
      console.log('API: Doctors response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch doctors');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error fetching doctors:', error);
      throw error;
    }
  },

  // NEW FUNCTION: Get all doctors for online meetings
  getAllDoctorsForOnlineMeeting: async (elderId) => {
    try {
      console.log('API: Fetching all doctors for online meeting, elder ID:', elderId);
      const response = await fetch(`${API_BASE}/${elderId}/doctors/online`);
      const data = await response.json();
      
      console.log('API: Online doctors response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch doctors for online meeting');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error fetching doctors for online meeting:', error);
      throw error;
    }
  },

  // Update elder details
  updateElder: async (elderId, elderData) => {
    try {
      console.log('API: Updating elder:', elderId, elderData);
      const response = await fetch(`${API_BASE}/${elderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(elderData),
      });
      
      const data = await response.json();
      console.log('API: Update response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update elder details');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error updating elder details:', error);
      throw error;
    }
  },

  // Create new elder
  createElder: async (elderData) => {
    try {
      const response = await fetch(`${API_BASE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(elderData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create elder');
      }
      
      return data;
    } catch (error) {
      console.error('Error creating elder:', error);
      throw error;
    }
  },

  // Delete elder
  deleteElder: async (elderId) => {
    try {
      const response = await fetch(`${API_BASE}/${elderId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete elder');
      }
      
      return data;
    } catch (error) {
      console.error('Error deleting elder:', error);
      throw error;
    }
  },

  // Get elder statistics
  getElderStats: async (familyMemberId) => {
    try {
      const response = await fetch(`${API_BASE}/stats/${familyMemberId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch elder statistics');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching elder statistics:', error);
      throw error;
    }
  },

  // Search elders
  searchElders: async (familyMemberId, query) => {
    try {
      const response = await fetch(`${API_BASE}/search/${familyMemberId}?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to search elders');
      }
      
      return data;
    } catch (error) {
      console.error('Error searching elders:', error);
      throw error;
    }
  },

  // Get elders with medical conditions
  getEldersWithMedicalConditions: async (familyMemberId) => {
    try {
      const response = await fetch(`${API_BASE}/medical-conditions/${familyMemberId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch elders with medical conditions');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching elders with medical conditions:', error);
      throw error;
    }
  },

  // Update elder photo
  updateElderPhoto: async (elderId, photoData) => {
    try {
      const response = await fetch(`${API_BASE}/${elderId}/photo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(photoData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update elder photo');
      }
      
      return data;
    } catch (error) {
      console.error('Error updating elder photo:', error);
      throw error;
    }
      }
};

export const getElderDetailsByEmail = (email) => {
  return axios.get(`${API_BASE}/elderDetails`, {
    params: { email }
  });
};

export const updateElderDetails = (elderId, elderData) => {
  return axios.put(`${API_BASE}/${elderId}`, elderData);
};

// New appointment-related functions
export const getUpcomingAppointments = (elderId) => {
  return axios.get(`${API_BASE}/${elderId}/appointments/upcoming`);
};

export const getPastAppointments = (elderId) => {
  return axios.get(`${API_BASE}/${elderId}/appointments/past`);
};

export const getAllAppointments = (elderId) => {
  return axios.get(`${API_BASE}/${elderId}/appointments`);
};

export const getAppointmentById = (elderId, appointmentId) => {
  return axios.get(`${API_BASE}/${elderId}/appointments/${appointmentId}`);
};

export const cancelAppointment = (elderId, appointmentId) => {
  return axios.put(`${API_BASE}/${elderId}/appointments/${appointmentId}/cancel`);
};

export const rescheduleAppointment = (elderId, appointmentId, newDateTime) => {
  return axios.put(`${API_BASE}/${elderId}/appointments/${appointmentId}/reschedule`, {
    newDateTime
  });
};

