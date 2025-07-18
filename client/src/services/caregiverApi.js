import axios from 'axios';
const API_BASE = 'http://localhost:5000/api/caregivers';

export const caregiverApi = {
  // Get all caregivers
  getAllCaregivers: async () => {
    try {
      console.log('API: Fetching all caregivers');
      const response = await fetch(`${API_BASE}`);
      const data = await response.json();
      
      console.log('API: Caregivers response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch caregivers');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error fetching caregivers:', error);
      throw error;
    }
  },

  // Get caregiver by ID
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

  // Get active caregiver count
  getActiveCaregiverCount: async () => {
    try {
      console.log('API: Fetching active caregiver count');
      const response = await fetch(`${API_BASE}/count/active`);
      const data = await response.json();
      
      console.log('API: Active caregiver count response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch active caregiver count');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error fetching active caregiver count:', error);
      throw error;
    }
  },

  // Get caregiver statistics
  getCaregiverStats: async () => {
    try {
      console.log('API: Fetching caregiver statistics');
      const response = await fetch(`${API_BASE}/stats`);
      const data = await response.json();
      
      console.log('API: Caregiver stats response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch caregiver statistics');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error fetching caregiver statistics:', error);
      throw error;
    }
  },

  // Create care request (book caregiver)
  createCareRequest: async (caregiverId, requestData) => {
    try {
      console.log('API: Creating care request:', caregiverId, requestData);
      const response = await fetch(`${API_BASE}/${caregiverId}/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      const data = await response.json();
      console.log('API: Care request response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create care request');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error creating care request:', error);
      throw error;
    }
  },

  // Get care requests for family member
  getCareRequestsByFamily: async (familyMemberId) => {
    try {
      console.log('API: Fetching care requests for family member:', familyMemberId);
      const response = await fetch(`${API_BASE}/requests/family/${familyMemberId}`);
      const data = await response.json();
      
      console.log('API: Care requests response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch care requests');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error fetching care requests:', error);
      throw error;
    }
  },

  // Search caregivers
  searchCaregivers: async (searchParams) => {
    try {
      const { query, district, certifications } = searchParams;
      const params = new URLSearchParams();
      
      if (query) params.append('query', query);
      if (district) params.append('district', district);
      if (certifications) params.append('certifications', certifications);
      
      console.log('API: Searching caregivers with params:', searchParams);
      const response = await fetch(`${API_BASE}/search?${params.toString()}`);
      const data = await response.json();
      
      console.log('API: Search caregivers response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to search caregivers');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error searching caregivers:', error);
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

  // Get assigned elders for caregiver(role caregiver)
  fetchAssignedElders: async (caregiverId) => {
    try {
      const response = await axios.get(`${API_BASE}/${caregiverId}/assigned-elders`);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching assigned elders:', error);
      return [];
    }
  },

  // Get number of assigned families for caregiver(role caregiver)
  getAssignedFamiliesCount: async (caregiverId) => {
    try {
      const response = await axios.get(`${API_BASE}/assigned-families/${caregiverId}`);
      return response.data;
    } catch (error) {
      console.error('API: Error fetching assigned families count:', error);
      return { count: 0 };
    }
  },

};

export default caregiverApi;
