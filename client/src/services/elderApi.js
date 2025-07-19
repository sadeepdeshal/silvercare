import axios from 'axios';

// Use consistent API base URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const API_BASE = `${API_BASE_URL}/api/elders`;

// Helper function to get auth token
const getAuthToken = () => {
  // Check for the correct token key used in AuthContext
  const token = localStorage.getItem('silvercare_token') || 
                localStorage.getItem('token') || 
                localStorage.getItem('authToken') || 
                localStorage.getItem('accessToken');
  
  console.log('Retrieved token from silvercare_token:', token ? `${token.substring(0, 20)}...` : 'No token found');
  return token;
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  console.log('Auth headers:', { 
    ...headers, 
    Authorization: headers.Authorization ? `Bearer ${headers.Authorization.substring(7, 27)}...` : 'No auth header' 
  });
  return headers;
};

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

  // Get all doctors for online meetings
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

  // Get doctor information by ID
  getDoctorById: async (doctorId) => {
    try {
      console.log('API: Fetching doctor by ID:', doctorId);
      const response = await fetch(`${API_BASE}/doctor/${doctorId}`);
      const data = await response.json();
      
      console.log('API: Doctor details response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch doctor details');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error fetching doctor details:', error);
      throw error;
    }
  },

  // Get appointment booking info (both elder and doctor)
  getAppointmentBookingInfo: async (elderId, doctorId) => {
    try {
      console.log('API: Fetching appointment booking info for elder:', elderId, 'doctor:', doctorId);
      const response = await fetch(`${API_BASE}/${elderId}/appointment-booking/${doctorId}`);
      const data = await response.json();
      
      console.log('API: Appointment booking info response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch appointment booking information');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error fetching appointment booking info:', error);
      throw error;
    }
  },

  // Get blocked time slots for a doctor on a specific date
  getBlockedTimeSlots: async (doctorId, date, appointmentType) => {
    try {
      console.log('API: Fetching blocked time slots for doctor:', doctorId, 'date:', date, 'type:', appointmentType);
      
      const url = `${API_BASE}/doctor/${doctorId}/blocked-slots/${date}?appointmentType=${appointmentType}`;
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('API: Blocked time slots response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch blocked time slots');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error fetching blocked time slots:', error);
      throw error;
    }
  },

  // Create temporary booking (blocks slot for 10 minutes)
  createTemporaryBooking: async (elderId, bookingData) => {
    try {
      console.log('API: Creating temporary booking for elder:', elderId, 'with data:', bookingData);
      const response = await fetch(`${API_BASE}/${elderId}/temporary-booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });
      
      const data = await response.json();
      console.log('API: Create temporary booking response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create temporary booking');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error creating temporary booking:', error);
      throw error;
    }
  },

  // Cancel temporary booking
  cancelTemporaryBooking: async (tempBookingId) => {
    try {
      console.log('API: Canceling temporary booking:', tempBookingId);
      const response = await fetch(`${API_BASE}/temporary-booking/${tempBookingId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      console.log('API: Cancel temporary booking response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel temporary booking');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error canceling temporary booking:', error);
      throw error;
    }
  },

  // PAYMENT METHODS - UPDATED WITH CORRECT TOKEN HANDLING

  // Create payment intent
  createPaymentIntent: async (paymentData) => {
    try {
      console.log('API: Creating payment intent with data:', paymentData);
      
      const headers = getAuthHeaders();
      console.log('API: Using headers for payment intent:', headers);
      
      const response = await fetch(`${API_BASE_URL}/api/payment/create-payment-intent`, {
        method: 'POST',
        headers,
        body: JSON.stringify(paymentData)
      });

      console.log('API: Payment intent response status:', response.status);
      
      const data = await response.json();
      console.log('API: Payment intent response data:', data);

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Authentication failed. Token may be invalid or expired.');
          // Clear potentially invalid tokens
          localStorage.removeItem('silvercare_token');
          localStorage.removeItem('silvercare_user');
          localStorage.removeItem('silvercare_role');
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('API: Error creating payment intent:', error);
      throw error;
    }
  },

  // Get payment intent status
  getPaymentIntentStatus: async (paymentIntentId) => {
    try {
      console.log('API: Getting payment intent status for:', paymentIntentId);
      
      const headers = getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/payment/payment-intent/${paymentIntentId}`, {
        method: 'GET',
        headers
      });

      console.log('API: Payment intent status response status:', response.status);
      const data = await response.json();
      console.log('API: Payment intent status response:', data);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('silvercare_token');
          localStorage.removeItem('silvercare_user');
          localStorage.removeItem('silvercare_role');
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(data.error || 'Failed to get payment status');
      }

      return data;
    } catch (error) {
      console.error('API: Error getting payment status:', error);
      throw error;
    }
  },

  // Confirm payment and create appointment
  confirmPaymentAndCreateAppointment: async (elderId, confirmationData) => {
    try {
      console.log('API: Confirming payment and creating appointment for elder:', elderId);
      console.log('API: Confirmation data:', confirmationData);
      
      const headers = getAuthHeaders();
      
      const response = await fetch(`${API_BASE}/${elderId}/confirm-payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify(confirmationData)
      });

      console.log('API: Confirm payment response status:', response.status);
      const data = await response.json();
      console.log('API: Confirm payment response:', data);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('silvercare_token');
          localStorage.removeItem('silvercare_user');
          localStorage.removeItem('silvercare_role');
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(data.error || 'Failed to confirm payment');
      }

      return data;
    } catch (error) {
      console.error('API: Error confirming payment:', error);
      throw error;
    }
  },

  // Create appointment (simplified - keeping existing method)
  createAppointment: async (elderId, appointmentData) => {
    try {
      console.log('API: Creating appointment for elder:', elderId, 'with data:', appointmentData);
      const response = await fetch(`${API_BASE}/${elderId}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });
      
      const data = await response.json();
      console.log('API: Create appointment response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create appointment');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error creating appointment:', error);
      throw error;
    }
  },

  // Get elder appointments
  getElderAppointments: async (elderId, filters = {}) => {
    try {
      console.log('API: Fetching appointments for elder:', elderId, 'with filters:', filters);
      
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.limit) queryParams.append('limit', filters.limit);
      
      const url = `${API_BASE}/${elderId}/appointments${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('API: Elder appointments response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch appointments');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error fetching elder appointments:', error);
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

  // Get upcoming appointments for family member
  getUpcomingAppointmentsByFamily: async (familyMemberId) => {
    try {
      console.log('API: Fetching upcoming appointments for family member:', familyMemberId);
      const response = await fetch(`${API_BASE}/family-member/${familyMemberId}/appointments/upcoming`);
      const data = await response.json();
      
      console.log('API: Upcoming appointments response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch upcoming appointments');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error fetching upcoming appointments:', error);
      throw error;
    }
  },

  // Get appointment count for family member
  getAppointmentCountByFamily: async (familyMemberId) => {
    try {
      console.log('API: Fetching appointment count for family member:', familyMemberId);
      const response = await fetch(`${API_BASE}/family-member/${familyMemberId}/appointments/count`);
      const data = await response.json();
      
      console.log('API: Appointment count response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch appointment count');
      }
      
      return data;
    } catch (error) {
      console.error('API: Error fetching appointment count:', error);
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
