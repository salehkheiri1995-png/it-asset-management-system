import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/reports/dashboard'), api.get('/reports/tickets/monthly')])
      .then(([s, m]) => { setStats(s.data); setMonthly(m.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  const pieData = {
    labels: ['تجهیزات تخصیص‌یافته', 'تجهیزات آزاد'],
    datasets: [{ data: [stats?.assigned_assets || 0, Math.max(0, (stats?.total_assets || 0) - (stats?.assigned_assets || 0))], backgroundColor: ['#f97316', '#3b82f6'], borderWidth: 0 }]
  };
  const barData = {
    labels: monthly.map(x => x.label),
    datasets: [{ label: 'تعداد تیکت', data: monthly.map(x => x.value), backgroundColor: '#f97316', borderRadius: 6 }]
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">📈 گزارش‌ها و تحلیل‌ها</div>
        <div className="page-subtitle">گزارش‌های تحلیلی سامانه</div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'کل تجهیزات', value: stats?.total_assets, icon: '💻', color: 'orange' },
          { label: 'تجهیزات تخصیص‌یافته', value: stats?.assigned_assets, icon: '🔗', color: 'green' },
          { label: 'تیکت‌های باز', value: stats?.open_tickets, icon: '🎫', color: 'blue' },
          { label: 'بازرسی موعدگذشته', value: stats?.overdue_inspections, icon: '⚠️', color: 'red' },
        ].map((c, i) => (
          <div className="stat-card" key={i}>
            <div className={`stat-icon ${c.color}`}>{c.icon}</div>
            <div><div className="stat-value">{(c.value || 0).toLocaleString('fa-IR')}</div><div className="stat-label">{c.label}</div></div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="card-section">
          <div className="card-section-header"><span className="card-section-title">📊 تیکت‌ها ماهانه</span></div>
          <div className="card-section-body"><Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} /></div>
        </div>
        <div className="card-section">
          <div className="card-section-header"><span className="card-section-title">🖥️ تجهیزات</span></div>
          <div className="card-section-body" style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ maxWidth: 300 }}><Pie data={pieData} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
