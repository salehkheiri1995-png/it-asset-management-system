import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const navItems = [
  { path: '/dashboard',   icon: '📊', label: 'داشبورد' },
  { path: '/employees',   icon: '👥', label: 'کارمندان' },
  { path: '/assets',      icon: '💻', label: 'تجهیزات' },
  { path: '/assignments', icon: '🔗', label: 'تخصیص تجهیزات' },
  { path: '/inspections', icon: '🔍', label: 'بازرسی‌ها' },
  { path: '/tickets',     icon: '🎫', label: 'تیکت‌های پشتیبانی' },
  { path: '/reports',     icon: '📈', label: 'گزارش‌ها' },
  { path: '/settings',    icon: '⚙️',  label: 'تنظیمات' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [toasts, setToasts] = useState([]);

  // expose global toast function
  useEffect(() => {
    window.showToast = (msg, type = 'default') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, msg, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };
    return () => { delete window.showToast; };
  }, []);

  useEffect(() => {
    api.get('/inspections/alerts/today').then(r => setAlerts(r.data || [])).catch(() => {});
  }, []);

  const pageName = navItems.find(n => location.pathname.startsWith(n.path) && n.path !== '/dashboard' || location.pathname === n.path)?.label || 'داشبورد';

  const handleLogout = () => { logout(); navigate('/'); };

  const toastIcon = { success: '✅', danger: '❌', info: 'ℹ️', default: '🔔' };

  return (
    <div className="app-layout" dir="rtl">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">⚡</span>
            {sidebarOpen && <span className="logo-text">سامانه IT</span>}
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '◄' : '►'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname.startsWith(item.path) && (item.path !== '/' ) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
              {item.path === '/inspections' && alerts.length > 0 && sidebarOpen && (
                <span className="nav-badge">{alerts.length}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.full_name?.charAt(0) || 'A'}</div>
            {sidebarOpen && (
              <div className="user-details">
                <div className="user-name">{user?.full_name || user?.username}</div>
                <div className="user-role">{user?.role === 'admin' ? 'مدیر سیستم' : user?.role}</div>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button className="logout-btn" onClick={handleLogout}>🚪 خروج از سیستم</button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        {/* Top bar */}
        <header className="topbar">
          {!sidebarOpen && (
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(true)} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>►</button>
          )}
          <span className="topbar-title">{pageName}</span>
          <span className="topbar-spacer" />
          <div className="topbar-actions">
            {alerts.length > 0 && (
              <button className="topbar-icon-btn" title="هشدارهای بازرسی" onClick={() => navigate('/inspections')}>
                🔔
                <span className="topbar-badge">{alerts.length}</span>
              </button>
            )}
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '.25rem .625rem', fontSize: '.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
              👤 {user?.full_name || user?.username}
            </div>
          </div>
        </header>

        <main className="page-wrapper">{children}</main>
      </div>

      {/* Toast container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{toastIcon[t.type] || toastIcon.default}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
