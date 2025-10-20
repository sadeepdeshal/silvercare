import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('silvercare_token') || ''}`,
});

export const getDoctorByUserId = async (userId) => {
  const res = await axios.get(`${BASE_URL}/doctor/user/${userId}`, { headers: authHeaders() });
  return res.data;
};

export const listBlockedTimes = async (doctorId, { from, to } = {}) => {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await axios.get(`${BASE_URL}/doctor/${doctorId}/blocked`, {
    headers: authHeaders(),
    params,
  });
  return res.data;
};

export const createBlockedTime = async (doctorId, payload) => {
  const res = await axios.post(`${BASE_URL}/doctor/${doctorId}/blocked`, payload, {
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
  });
  return res.data;
};

export const deleteBlockedTime = async (doctorId, blockedId) => {
  const res = await axios.delete(`${BASE_URL}/doctor/${doctorId}/blocked/${blockedId}`, {
    headers: authHeaders(),
  });
  return res.data;
};

export default {
  getDoctorByUserId,
  listBlockedTimes,
  createBlockedTime,
  deleteBlockedTime,
};
