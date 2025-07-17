const API_BASE_URL = 'http://localhost:5000/api';

export const adminApi = {
  // Get admin dashboard data
  getDashboardData: async () => {
    try {
      console.log('Fetching dashboard data from:', `${API_BASE_URL}/admin/dashboard`);
      const response = await fetch(`${API_BASE_URL}/admin/dashboard`);
      
      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }
      
      const data = await response.json();
      console.log('Dashboard data received:', data);
      return data;
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      throw error;
    }
  },

  // Approve professional
  approveProfessional: async (type, professionalId) => {
    try {
      console.log('Approving professional:', type, professionalId);
      const response = await fetch(`${API_BASE_URL}/admin/approve/${type}/${professionalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error approving professional:', error);
      throw error;
    }
  },

  // Reject professional
  rejectProfessional: async (type, professionalId) => {
    try {
      console.log('Rejecting professional:', type, professionalId);
      const response = await fetch(`${API_BASE_URL}/admin/reject/${type}/${professionalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error rejecting professional:', error);
      throw error;
    }
  },

  // Get all users
  getAllUsers: async () => {
    try {
      console.log('Fetching all users from:', `${API_BASE_URL}/admin/users`);
      const response = await fetch(`${API_BASE_URL}/admin/users`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }
};