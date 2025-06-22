import axios from 'axios';
const API = 'http://localhost:5000/api/users';

export const getUsers = () => axios.get(API);
export const addUser = (user) => axios.post(API, user);
export const updateUser = (id, user) => axios.put(`${API}/${id}`, user);
export const deleteUser = (id) => axios.delete(`${API}/${id}`);
