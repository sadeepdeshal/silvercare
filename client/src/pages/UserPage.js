import React, { useEffect, useState } from 'react';
import { getUsers, addUser, updateUser, deleteUser } from '../services/api';
import UserForm from '../components/UserForm';
import UserList from '../components/UserList';

function UserPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', id: null });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = () => getUsers().then(res => setUsers(res.data));

  const handleSubmit = (e) => {
    e.preventDefault();
    const action = form.id ? updateUser(form.id, form) : addUser(form);
    action.then(() => {
      setForm({ name: '', email: '', id: null });
      fetchUsers();
    });
  };

  const handleEdit = (user) => setForm(user);
  const handleDelete = (id) => deleteUser(id).then(fetchUsers);

  return (
    <div>
      <h1>SilverCare Users</h1>
      <UserForm form={form} setForm={setForm} onSubmit={handleSubmit} />
      <UserList users={users} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  );
}

export default UserPage;
