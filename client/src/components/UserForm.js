import React from 'react';

function UserForm({ form, setForm, onSubmit }) {
  return (
    <form onSubmit={onSubmit}>
      <input
        type="text"
        placeholder="Name"
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={e => setForm({ ...form, email: e.target.value })}
        required
      />
      <button type="submit">{form.id ? "Update" : "Add"} User</button>
    </form>
  );
}

export default UserForm;
