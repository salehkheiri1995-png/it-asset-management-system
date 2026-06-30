import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, ArcElement,
  BarElement, Tooltip, Legend, PointElement, LineElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, ArcElement, BarElement, Tooltip, Legend, PointElement, LineElement);

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [ticketMonthly, setTicketMonthly] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, t, a] = await Promise.all([
          api.get('/reports/dashboard'),
          api.get('/reports/tickets/monthly'),
          api.get('/inspections/alerts/today'),
        ]);
        setStats(s.data);
        setTicketMonthly(t.data);
        setAlerts(a.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  const doughnutData = {
    labels: ['تخصیص‌یافته', 'آزاد'],
    datasets: [{
      data: [stats?.assigned_assets || 0, Math.max(0, (stats?.total_assets || 0) - (stats?.assigned_assets || 0))],
      backgroundColor: ['#f97316', '#e2e8f0'],
      borderWidth: 0,
    }]
  };

  const barData = {
    labels: ticketMonthly.map(x => x.label),
    datasets: [{
      label: 'تعداد تیکت',
      data: ticketMonthly.map(x => x.value),
      backgroundColor: 'rgba(249,115,22,0.7)',
      borderRadius: 6,
    }]
  };

  const statCards = [
    { label: 'کل تجهیزات', value: stats?.total_assets || 0, icon: '💻', color: 'orange' },
    { label: 'تجهیزات تخصیص‌یافته', value: stats?.assigned_assets || 0, icon: '🔗', color: 'green' },
    { label: 'تیکت‌های باز', value: stats?.open_tickets || 0, icon: '🎫', color: 'blue' },
    { label: 'بازرسی موعدگذشته', value: stats?.overdue_inspections || 0, icon: '⚠️', color: 'red' },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-title">📊 داشبورد مدیریتی</div>
        <div className="page-subtitle">نمای کلی سامانه مدیریت دارایی‌های IT</div>
      </div>

      <div className="stats-grid">
        {statCards.map((c, i) => (
          <div className="stat-card" key={i}>
            <div className={`stat-icon ${c.color}`}>{c.icon}</div>
            <div>
              <div className="stat-value">{c.value.toLocaleString('fa-IR')}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="card-section">
          <div className="card-section-header">
            <span className="card-section-title">📈 تیکت‌ها به تفکیک ماه</span>
          </div>
          <div className="card-section-body">
            <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
        </div>

        <div className="card-section">
          <div className="card-section-header">
            <span className="card-section-title">🖥️ وضعیت تجهیزات</span>
          </div>
          <div className="card-section-body" style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ maxWidth: 280 }}>
              <Doughnut data={doughnutData} options={{ responsive: true, cutout: '70%' }} />
            </div>
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="card-section">
          <div className="card-section-header">
            <span className="card-section-title">🔔 هشدارهای بازرسی</span>
            <span className="badge badge-danger">{alerts.length}</span>
          </div>
          <div className="card-section-body">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr><th>نوع بازرسی</th><th>موعد</th><th>تجهیز</th><th>وضعیت</th></tr>
                </thead>
                <tbody>
                  {alerts.map((a) => (
                    <tr key={a.id}>
                      <td>{a.type}</td>
                      <td>{new Date(a.due_at).toLocaleDateString('fa-IR')}</td>
                      <td>{a.asset_id || '-'}</td>
                      <td><span className="badge badge-danger">موعدرسیده</span></td>
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
