const API_BASE = 'http://localhost:5000/api/elders';

export const elderApi = {
  // Get all elders for a family member
  getEldersByFamilyMember: async (familyMemberId) => {
    try {
      const response = await fetch(`${API_BASE}/family-member/${familyMemberId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch elders');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching elders:', error);
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
  }
};
