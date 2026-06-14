import { useState, useEffect } from 'react';

const ROLES = ['member', 'moderator', 'admin'];

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ username: '', display_name: '', email: '', admin_roles: 'member' });

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsers(); }, []);

  async function handleCreate() {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    });
    if (res.ok) { setShowAddModal(false); setForm({ username: '', display_name: '', email: '', admin_roles: 'member' }); fetchUsers(); }
    else { const d = await res.json(); alert(d.error); }
  }

  async function handleUpdate() {
    const res = await fetch(`/api/admin/users/${editUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ display_name: form.display_name, email: form.email, admin_roles: form.admin_roles }),
    });
    if (res.ok) { setEditUser(null); fetchUsers(); }
    else { const d = await res.json(); alert(d.error); }
  }

  async function handleDeactivate(id) {
    if (!confirm('Deactivate this user?')) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) fetchUsers();
    else { const d = await res.json(); alert(d.error); }
  }

  function openEdit(user) {
    setEditUser(user);
    setForm({ username: user.username, display_name: user.display_name, email: user.email, admin_roles: user.admin_roles });
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2>User Management</h2>
        <button onClick={() => setShowAddModal(true)}>+ Add User</button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Username', 'Display Name', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
              <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '8px' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td style={{ padding: '8px' }}>{user.username}</td>
              <td style={{ padding: '8px' }}>{user.display_name}</td>
              <td style={{ padding: '8px' }}>{user.email}</td>
              <td style={{ padding: '8px' }}>{user.admin_roles}</td>
              <td style={{ padding: '8px' }}>{user.joined_at ? new Date(user.joined_at).toLocaleDateString() : '-'}</td>
              <td style={{ padding: '8px', display: 'flex', gap: '8px' }}>
                <button onClick={() => openEdit(user)}>Edit</button>
                <button onClick={() => handleDeactivate(user.id)}>Deactivate</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {(showAddModal || editUser) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3>{editUser ? 'Edit User' : 'Add User'}</h3>
            {!editUser && <input placeholder="Username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />}
            <input placeholder="Display Name" value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} />
            <input placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <select value={form.admin_roles} onChange={e => setForm(f => ({ ...f, admin_roles: e.target.value }))}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={editUser ? handleUpdate : handleCreate}>{editUser ? 'Save' : 'Create'}</button>
              <button onClick={() => { setShowAddModal(false); setEditUser(null); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}