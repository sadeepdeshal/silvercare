import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/auth';

export const loginUser = (credentials) => {
  return axios.post(`${API_BASE}/login`, credentials);
};
