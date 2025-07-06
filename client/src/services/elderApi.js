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

  // Update elder details
  updateElder: async (elderId, elderData) => {
    try {
      const response = await fetch(`${API_BASE}/${elderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(elderData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update elder details');
      }
      
      return data;
    } catch (error) {
      console.error('Error updating elder details:', error);
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


