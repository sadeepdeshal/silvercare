import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/register';

export const registerFamilyMember = (userData) => {
  return axios.post(`${API_BASE}/family-member`, userData);
};

export const getRegistrations = () => {
  return axios.get(API_BASE);
};
