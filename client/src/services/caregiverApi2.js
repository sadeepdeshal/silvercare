import axios from 'axios';
const API_BASE = 'http://localhost:5000/api/caregivers';

export const caregiverApi = {

  // Get assigned elders for caregiver(role caregiver)
  fetchAssignedElders: async (caregiverId) => {
    try {
      const response = await axios.get(`${API_BASE}/${caregiverId}/assigned-elders`);
      console.log('fetchAssignedElders API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching assigned elders:', error);
      return [];
    }
  },

  // Get number of assigned families for caregiver(role caregiver)
  getAssignedFamiliesCount: async (caregiverId) => {
    try {
      const response = await axios.get(`${API_BASE}/${caregiverId}/assigned-families`);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching assigned families count:', error);
      return { count: 0 };
    }
  },

  // Get number of carelogs(role caregiver)
  getcarelogsCount: async (caregiverId) => {
    try {
      const response = await axios.get(`${API_BASE}/${caregiverId}/carelogs-count`);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching carelogs count:', error);
      return { count: 0 };
    }
  },

  // Get caregiver schedules(role caregiver)
  fetchSchedules: async (caregiverId) => {
    try {
      const response = await axios.get(`${API_BASE}/${caregiverId}/caregiver-schedules`);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching schedules:', error);
      return [];
    }
  },

  // Get care requests for caregiver(role caregiver)
  fetchCareRequests: async (caregiverId, searchTerm = '') => {
    try {
      let url = `${API_BASE}/${caregiverId}/care-requests`;
      if (searchTerm) {
        url += `?search=${encodeURIComponent(searchTerm)}`;
      }
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching care requests:', error);
      return [];
    }
  },

  // Get upcoming shifts for caregiver with optional week filtering
  fetchUpcomingShifts: async (caregiverId, startDate = null, endDate = null) => {
    try {
      let url = `${API_BASE}/${caregiverId}/upcoming-shifts`;
      if (startDate && endDate) {
        url += `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      }
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching upcoming shifts:', error);
      return [];
    }
  },

  // Get care request details by ID(role caregiver)
  getCareRequestDetails: async (requestId) => {
    try {
      console.log('API: Fetching care request details for ID:', requestId);
      const response = await fetch(`${API_BASE}/requests/${requestId}`);
      const data = await response.json();
      
      console.log('API: Care request details response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch care request details');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error fetching care request details:', error);
      throw error;
    }
  },

  // Update care request status
  updateCareRequestStatus: async (requestId, status) => {
    try {
      console.log('API: Updating care request status:', requestId, status);
      const response = await fetch(`${API_BASE}/requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      const data = await response.json();
      console.log('API: Update status response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update care request status');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error updating care request status:', error);
      throw error;
    }
  },

  // Get caregiver by ID(role caregiver)
  getCaregiverById: async (caregiverId) => {
    try {
      console.log('API: Fetching caregiver by ID:', caregiverId);
      const response = await fetch(`${API_BASE}/${caregiverId}`);
      const data = await response.json();
      
      console.log('API: Caregiver details response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch caregiver details');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error fetching caregiver details:', error);
      throw error;
    }
  },

  // Update caregiver profile(role caregiver)
  updateCaregiverProfile: async (caregiverId, profileData) => {
    try {
      console.log('API: Updating caregiver profile:', caregiverId, profileData);
      const response = await fetch(`${API_BASE}/${caregiverId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      const data = await response.json();
      console.log('API: Update profile response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error updating profile:', error);
      throw error;
    }
  },

  // Update caregiver password(role caregiver)
  updateCaregiverPassword: async (caregiverId, passwordData) => {
    try {
      console.log('API: Updating caregiver password:', caregiverId);
      const response = await fetch(`${API_BASE}/${caregiverId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      });
      
      const data = await response.json();
      console.log('API: Update password response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error updating password:', error);
      throw error;
    }
  },


    // Get carelogs for caregiver
  getCarelogs: async (caregiverId) => {
    try {
      const response = await axios.get(`${API_BASE}/${caregiverId}/carelogs`);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching carelogs:', error);
      return { carelogs: [] };
    }
  },

  // Add a new carelog for caregiver
  addCarelog: async (caregiverId, carelogData) => {
    try {
      const response = await axios.post(`${API_BASE}/${caregiverId}/carelogs`, carelogData);
      return response.data;
    } catch (error) {
      console.error('API: Error adding carelog:', error);
      throw error;
    }
  },

  // Get elder details with family information
  getElderDetails: async (elderId, caregiverId = null) => {
    try {
      console.log('API: Fetching elder details for elderId:', elderId, 'caregiverId:', caregiverId);
      const url = caregiverId 
        ? `${API_BASE}/elder/${elderId}/details?caregiver_id=${caregiverId}`
        : `${API_BASE}/elder/${elderId}/details`;
      console.log('API: Making request to:', url);
      const response = await axios.get(url);
      console.log('API: Elder details response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching elder details:', error);
      console.error('API: Error response:', error.response?.data);
      console.error('API: Error status:', error.response?.status);
      throw error;
    }
  },

  // Get carelogs for specific elder
  getElderCarelogs: async (caregiverId, elderId) => {
    try {
      const response = await axios.get(`${API_BASE}/${caregiverId}/elder/${elderId}/carelogs`);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching elder carelogs:', error);
      return { carelogs: [] };
    }
  },

  // Add detailed elder report
  addElderReport: async (caregiverId, elderId, reportData) => {
    try {
      const response = await axios.post(`${API_BASE}/${caregiverId}/elder/${elderId}/report`, reportData);
      return response.data;
    } catch (error) {
      console.error('API: Error adding elder report:', error);
      throw error;
    }
  },

  // Fetch weekly reports for daily care section
  fetchWeeklyReports: async (caregiverId, startDate, endDate) => {
    try {
      const response = await axios.get(`${API_BASE}/${caregiverId}/weekly-reports?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching weekly reports:', error);
      return [];
    }
  },

  // Submit daily report
  submitDailyReport: async (caregiverId, elderId, reportData) => {
    try {
      const response = await axios.post(`${API_BASE}/${caregiverId}/daily-report`, {
        elder_id: elderId,
        ...reportData
      });
      return response.data;
    } catch (error) {
      console.error('API: Error submitting daily report:', error);
      throw error;
    }
  },

};

export default caregiverApi;
