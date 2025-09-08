import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--accent-blue)' }}>
            🎯 Dart Snizzle
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Professional Dart Counter
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded" style={{ 
            backgroundColor: 'var(--accent-red)', 
            color: 'white' 
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-group">
            <label className="form-label">Username or Email</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your username or email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`btn btn-primary btn-large w-full ${loading ? 'loading' : ''}`}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p style={{ color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link 
              to="/register" 
              style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}
            >
              Sign up here
            </Link>
          </p>
        </div>

        <div className="text-center mt-4 p-3 rounded" style={{ 
          backgroundColor: 'var(--background-darker)' 
        }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            ⚠️ New accounts require admin approval
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;