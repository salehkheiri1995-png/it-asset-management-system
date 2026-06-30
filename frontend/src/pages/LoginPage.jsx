import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError('نام کاربری یا رمز عبور اشتباه است.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-circle">⚡</div>
          <h2>سامانه مدیریت دارایی‌های IT</h2>
          <p>اداره برق منطقه‌ای</p>
        </div>

        {error && <div className="alert-box danger">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">نام کاربری</label>
            <input
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="نام کاربری را وارد کنید"
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">رمز عبور</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="رمز عبور را وارد کنید"
              required
            />
          </div>
          <button
            className="btn-primary-custom"
            type="submit"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.9375rem' }}
          >
            {loading ? 'در حال ورود...' : '🔐 ورود به سیستم'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '10px', fontSize: '0.8125rem', color: '#64748b' }}>
          <strong>کاربر پیش‌فرض:</strong><br />
          نام کاربری: <code>admin</code> | رمز عبور: <code>Admin@123</code>
        </div>
      </div>
    </div>
  );
}
