import React from 'react';

const Dashboard = ({ user }) => {
  return (
    <div className="container">
      <div className="dashboard">
        <h1>Welcome to ApplyAI, {user.email}!</h1>
        <p>Your AI-powered job application assistant is ready to help you.</p>
        
        <div className="admin-panel">
          <div className="admin-header">
            <h3 className="admin-title">Account Information</h3>
          </div>
          <div style={{ padding: '1rem' }}>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Account Status:</strong> 
              <span className={`status-badge ${user.is_approved ? 'status-approved' : 'status-pending'}`}>
                {user.is_approved ? 'Approved' : 'Pending Approval'}
              </span>
            </p>
            <p><strong>Account Type:</strong> {user.is_admin ? 'Administrator' : 'User'}</p>
            <p><strong>Member Since:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3>Getting Started</h3>
          <ul style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
            <li>Complete your profile setup</li>
            <li>Upload your resume and cover letter templates</li>
            <li>Set your job preferences and criteria</li>
            <li>Start applying to jobs with AI assistance</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;