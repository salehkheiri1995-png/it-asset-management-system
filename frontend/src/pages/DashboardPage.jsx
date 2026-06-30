import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, ArcElement,
  BarElement, Tooltip, Legend,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, ArcElement, BarElement, Tooltip, Legend);

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats]   = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/dashboard'),
      api.get('/reports/tickets/monthly'),
      api.get('/inspections/alerts/today'),
    ]).then(([s, m, a]) => {
      setStats(s.data);
      setMonthly(m.data);
      setAlerts(a.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  const totalAssets   = stats?.total_assets || 0;
  const assignedAssets = stats?.assigned_assets || 0;
  const freeAssets     = Math.max(0, totalAssets - assignedAssets);
  const assignedPct    = totalAssets ? Math.round(assignedAssets / totalAssets * 100) : 0;

  const doughnutData = {
    labels: ['در استفاده', 'در انبار'],
    datasets: [{
      data: [assignedAssets, freeAssets],
      backgroundColor: ['#f97316', '#e0e7ff'],
      borderWidth: 0,
      hoverOffset: 4,
    }],
  };
  const barData = {
    labels: monthly.map(x => x.label),
    datasets: [{
      label: 'تعداد تیکت',
      data: monthly.map(x => x.value),
      backgroundColor: 'rgba(249,115,22,.75)',
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const kpis = [
    { label: 'کل تجهیزات',            value: totalAssets,                        icon: '💻', color: 'orange', path: '/assets',      sub: `${assignedPct}% در استفاده` },
    { label: 'کارمندان فعال',          value: stats?.active_employees || 0,       icon: '👥', color: 'green',  path: '/employees',  sub: 'با تجهیز تخصیص‌یافته' },
    { label: 'تیکت‌های باز',           value: stats?.open_tickets || 0,           icon: '🎫', color: 'blue',   path: '/tickets',    sub: 'نیاز به پیگیری' },
    { label: 'بازرسی موعدگذشته',       value: stats?.overdue_inspections || 0,    icon: '⚠️', color: 'red',    path: '/inspections',sub: 'فوری' },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">📊 داشبورد مدیریتی</div>
          <div className="page-subtitle">نمای کلی سامانه مدیریت دارایی‌های IT</div>
        </div>
      </div>

      {/* KPI Cards — clickable */}
      <div className="stats-grid">
        {kpis.map((k, i) => (
          <div key={i} className={`stat-card ${k.color}`} onClick={() => navigate(k.path)} style={{ cursor: 'pointer' }}>
            <div className="stat-top">
              <div className={`stat-icon ${k.color}`}>{k.icon}</div>
            </div>
            <div className="stat-value">{k.value.toLocaleString('fa-IR')}</div>
            <div className="stat-label">{k.label}</div>
            {k.sub && <div style={{ fontSize: '.73rem', color: 'var(--text-faint)', marginTop: '.25rem' }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Asset utilization bar */}
      <div className="card-section" style={{ marginBottom: '1rem' }}>
        <div className="card-section-header">
          <span className="card-section-title">📦 نرخ استفاده از تجهیزات</span>
          <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>{assignedAssets} از {totalAssets} تجهیز در استفاده</span>
        </div>
        <div className="card-section-body" style={{ padding: '.875rem 1.25rem' }}>
          <div className="progress-bar" style={{ height: 10 }}>
            <div className={`progress-fill ${assignedPct > 85 ? 'danger' : assignedPct > 60 ? '' : 'green'}`} style={{ width: `${assignedPct}%` }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.375rem', fontSize: '.78rem', color: 'var(--text-muted)' }}>
            <span>در استفاده: <strong>{assignedAssets}</strong></span>
            <span style={{ color: assignedPct > 85 ? 'var(--danger)' : 'var(--text-muted)' }}>{assignedPct}%</span>
            <span>آزاد: <strong>{freeAssets}</strong></span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card-section">
          <div className="card-section-header">
            <span className="card-section-title">📈 تیکت‌ها به تفکیک ماه</span>
          </div>
          <div className="card-section-body">
            {monthly.length === 0
              ? <div className="empty-state" style={{ padding: '2rem' }}><div className="empty-state-icon">📊</div><h4>داده‌ای موجود نیست</h4></div>
              : <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }} />
            }
          </div>
        </div>
        <div className="card-section">
          <div className="card-section-header">
            <span className="card-section-title">🖥️ وضعیت تجهیزات</span>
          </div>
          <div className="card-section-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ maxWidth: 220 }}>
              <Doughnut data={doughnutData} options={{ plugins: { legend: { display: false } }, cutout: '65%' }} />
            </div>
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {[{ label: 'در استفاده', val: assignedAssets, color: '#f97316' }, { label: 'در انبار', val: freeAssets, color: '#e0e7ff' }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.82rem', color: 'var(--text-muted)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, display: 'inline-block' }}></span>
                  {l.label}: <strong style={{ color: 'var(--text)' }}>{l.val}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="card-section">
          <div className="card-section-header">
            <span className="card-section-title">⚠️ هشدارهای بازرسی امروز</span>
            <span className="badge badge-danger">{alerts.length} مورد</span>
          </div>
          <div className="card-section-body" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="data-table">
                <thead><tr><th>تجهیز</th><th>نوع بازرسی</th><th>موعد</th><th>عملیات</th></tr></thead>
                <tbody>
                  {alerts.slice(0, 8).map(a => (
                    <tr key={a.id}>
                      <td><code>{a.asset_code || '-'}</code></td>
                      <td>{a.type}</td>
                      <td style={{ color: 'var(--danger)' }}>{new Date(a.due_at).toLocaleDateString('fa-IR')}</td>
                      <td>
                        <button className="btn-edit-custom" onClick={() => navigate('/inspections')}>مشاهده</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
