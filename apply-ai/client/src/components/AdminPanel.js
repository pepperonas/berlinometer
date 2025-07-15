import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await authService.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, isApproved) => {
    try {
      await authService.approveUser(userId, isApproved);
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_approved: isApproved } : user
      ));
    } catch (error) {
      setError('Failed to update user status');
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await authService.deleteUser(userId);
        setUsers(users.filter(user => user.id !== userId));
      } catch (error) {
        setError('Failed to delete user');
      }
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          Loading users...
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="admin-panel">
        <div className="admin-header">
          <h2 className="admin-title">User Management</h2>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div style={{ overflowX: 'auto' }}>
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Status</th>
                <th>Admin</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`status-badge ${user.is_approved ? 'status-approved' : 'status-pending'}`}>
                      {user.is_approved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td>{user.is_admin ? 'Yes' : 'No'}</td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    {!user.is_approved ? (
                      <button
                        className="action-button approve"
                        onClick={() => handleApprove(user.id, true)}
                      >
                        Approve
                      </button>
                    ) : (
                      <button
                        className="action-button reject"
                        onClick={() => handleApprove(user.id, false)}
                      >
                        Revoke
                      </button>
                    )}
                    {!user.is_admin && (
                      <button
                        className="action-button delete"
                        onClick={() => handleDelete(user.id)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {users.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            No users found.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;