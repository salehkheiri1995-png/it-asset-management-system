import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { path: '/dashboard', icon: '📊', label: 'داشبورد' },
  { path: '/employees', icon: '👥', label: 'کارمندان' },
  { path: '/assets', icon: '💻', label: 'تجهیزات' },
  { path: '/assignments', icon: '🔗', label: 'تخصیص تجهیزات' },
  { path: '/inspections', icon: '🔍', label: 'بازرسی‌ها' },
  { path: '/tickets', icon: '🎫', label: 'تیکت‌های پشتیبانی' },
  { path: '/reports', icon: '📈', label: 'گزارش‌ها' },
  { path: '/settings', icon: '⚙️', label: 'تنظیمات' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          {sidebarOpen && (
            <div className="user-info">
              <div className="user-avatar">{user?.full_name?.charAt(0) || 'A'}</div>
              <div className="user-details">
                <div className="user-name">{user?.full_name || user?.username}</div>
                <div className="user-role">{user?.role === 'admin' ? 'مدیر سیستم' : user?.role}</div>
              </div>
            </div>
          )}
          <button className="logout-btn" onClick={handleLogout} title="خروج">
            <span>🚪</span>
            {sidebarOpen && <span>خروج</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <div className="page-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
}
