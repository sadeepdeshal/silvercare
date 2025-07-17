import axios from 'axios';
const API_BASE = 'http://localhost:5000/api/elders';

export const getElderDetailsByEmail = (email) => {
  return axios.get(`${API_BASE}/elderDetails`, {
    params: { email }
  });
};

export const updateElderDetails = (elderId, elderData) => {
  return axios.put(`${API_BASE}/${elderId}`, elderData);
};

// New function to update elder profile with form data (for file uploads)
export const updateElderProfile = (elderId, formData) => {
  return axios.put(`${API_BASE}/${elderId}/profile`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Dashboard stats function
export const getElderDashboardStats = (elderId) => {
  return axios.get(`${API_BASE}/${elderId}/dashboard-stats`);
};

// Appointment-related functions
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
