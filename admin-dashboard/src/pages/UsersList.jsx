// pages/UsersList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaginationParams } from '../hooks/usePaginationParams';
import Pagination from '../components/Pagination';
import axiosInstance from '../api/axiosInstance';

const ITEMS_PER_PAGE = 10;

export default function UsersList() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const { page, setPage, resetPage } = usePaginationParams();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    axiosInstance
      .get(`/admin/users?page=${page}&limit=${ITEMS_PER_PAGE}&search=${search}`)
      .then(({ data }) => {
        if (!cancelled) {
          setUsers(data.users || []);
          setTotalItems(data.total || 0);
        }
      })
      .catch((err) => console.error('Failed to fetch users:', err))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [page, search]);

  function handleSearch(e) {
    setSearch(e.target.value);
    resetPage();
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1>Users</h1>

      {/* Search */}
      <input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={handleSearch}
        style={{
          marginBottom: '16px',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #d1d5db',
          width: '300px',
          fontSize: '0.9rem',
        }}
      />

      {/* Table */}
      {loading ? (
        <p>Loading...</p>
      ) : users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={tdStyle}>{(page - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                <td style={tdStyle}>{user.name}</td>
                <td style={tdStyle}>{user.email}</td>
                <td style={tdStyle}>{user.role || '—'}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => navigate(`/admin/users/${user.id}`)}
                    style={actionBtnStyle}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      <div style={{ marginTop: '20px' }}>
        <Pagination totalItems={totalItems} itemsPerPage={ITEMS_PER_PAGE} />
      </div>
    </div>
  );
}

const thStyle = {
  padding: '10px 14px',
  textAlign: 'left',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#374151',
};

const tdStyle = {
  padding: '10px 14px',
  fontSize: '0.9rem',
  color: '#4b5563',
};

const actionBtnStyle = {
  padding: '4px 12px',
  borderRadius: '4px',
  border: '1px solid #4f46e5',
  backgroundColor: 'transparent',
  color: '#4f46e5',
  cursor: 'pointer',
  fontSize: '0.85rem',
};
