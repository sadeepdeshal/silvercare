import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/register';

export const registerFamilyMember = (userData) => {
  return axios.post(`${API_BASE}/family-member`, userData);
};

export const registerCaregiver = (userData) => {
  return axios.post(`${API_BASE}/caregiver`, userData);
};

export const registerDoctor = (userData, isMultipart = false) => {
  return axios.post(`${API_BASE}/doctor`, userData, {
    headers: isMultipart ? { 'Content-Type': 'multipart/form-data' } : {}
  });
};

export const registerHealthProfessional = (userData, isMultipart = false) => {
  return axios.post(`${API_BASE}/health-professional`, userData, {
    headers: isMultipart ? { 'Content-Type': 'multipart/form-data' } : {}
  });
};

export const registerElder = (userData) => {
  return axios.post(`${API_BASE}/elder`, userData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getRegistrations = () => {
  return axios.get(API_BASE);
};

// New elder management functions
export const getEldersByFamilyMember = (familyMemberId) => {
  return axios.get(`${API_BASE}/elders/family-member/${familyMemberId}`);
};

export const getElderById = (elderId) => {
  return axios.get(`${API_BASE}/elders/${elderId}`);
};

export const updateElderById = (elderId, elderData) => {
  return axios.put(`${API_BASE}/elders/${elderId}`, elderData);
};
