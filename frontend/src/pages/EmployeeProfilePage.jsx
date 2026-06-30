import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const STATUS_LABELS = {
  healthy: { label: 'سالم', cls: 'badge-success' },
  needs_repair: { label: 'نیاز به تعمیر', cls: 'badge-warning' },
  broken: { label: 'خراب', cls: 'badge-danger' },
  retired: { label: 'بازنشسته', cls: 'badge-gray' },
};
const TICKET_STATUS = {
  opened: { label: 'باز', cls: 'badge-warning' },
  in_review: { label: 'در بررسی', cls: 'badge-orange' },
  in_progress: { label: 'در حال انجام', cls: 'badge-orange' },
  done: { label: 'انجام شده', cls: 'badge-success' },
  closed: { label: 'بسته', cls: 'badge-gray' },
};
const TICKET_PRIORITY = {
  low: { label: 'کم', cls: 'badge-gray' },
  medium: { label: 'متوسط', cls: 'badge-orange' },
  high: { label: 'زیاد', cls: 'badge-warning' },
  urgent: { label: 'فوری', cls: 'badge-danger' },
};
const INSPECTION_TYPE = { hardware: 'سخت‌افزاری', software: 'نرم‌افزاری', security: 'امنیتی', general: 'عمومی' };
const INSPECTION_RESULT = {
  ok: { label: 'سالم', cls: 'badge-success' },
  repair: { label: 'تعمیر', cls: 'badge-warning' },
  replace: { label: 'تعویض', cls: 'badge-danger' },
  follow_up: { label: 'پیگیری', cls: 'badge-orange' },
  issue_found: { label: 'مشکل', cls: 'badge-danger' },
};

export default function EmployeeProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assets');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/employees/${id}/profile`)
      .then(r => setData(r.data))
      .catch(() => setError('خطا در دریافت اطلاعات'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="empty-state"><div className="spinner"></div></div>;
  if (error || !data) return <div className="alert-box danger">{error || 'خطا'}</div>;

  const { employee: emp, assignments, inspections, tickets, stats } = data;
  const activeAssets = assignments.filter(a => a.status === 'assigned');

  const tabs = [
    { key: 'assets', label: 'تجهیزات فعلی', count: stats.active_assignments, icon: '💻' },
    { key: 'history', label: 'تاریخچه تخصیص', count: stats.total_assignments, icon: '📂' },
    { key: 'inspections', label: 'بازرسی‌ها', count: stats.total_inspections, icon: '🔍', badge: stats.pending_inspections > 0 ? stats.pending_inspections : null },
    { key: 'tickets', label: 'تیکت‌ها', count: stats.total_tickets, icon: '🎫', badge: stats.open_tickets > 0 ? stats.open_tickets : null },
  ];

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => navigate('/employees')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
          marginBottom: '1rem', background: 'none', border: 'none',
          color: 'var(--color-primary)', cursor: 'pointer', fontSize: 'var(--text-sm)',
          fontWeight: 500,
        }}
      >
        → بازگشت به لیست کارمندان
      </button>

      {/* Profile Header Card */}
      <div className="card-section" style={{ marginBottom: '1.25rem' }}>
        <div className="card-section-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--color-primary)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.75rem', fontWeight: 700, flexShrink: 0,
            }}>
              {emp.first_name.charAt(0)}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>
                  {emp.first_name} {emp.last_name}
                </h2>
                <span className={`badge ${emp.is_active ? 'badge-success' : 'badge-gray'}`}>
                  {emp.is_active ? 'فعال' : 'غیرفعال'}
                </span>
              </div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: '0.25rem' }}>
                کد پرسنلی: <strong>{emp.personnel_code}</strong>
                {emp.department && <span> &nbsp;·&nbsp; واحد: <strong>{emp.department.name}</strong></span>}
              </div>
              <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.5rem', flexWrap: 'wrap', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                {emp.phone && <span>📞 {emp.phone}</span>}
                {emp.email && <span>✉️ {emp.email}</span>}
                {emp.building && <span>🏢 ساختمان: {emp.building}{emp.floor ? ` / طبقه ${emp.floor}` : ''}{emp.room ? ` / اتاق ${emp.room}` : ''}</span>}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {[
                { label: 'تجهیز فعلی', value: stats.active_assignments, color: 'var(--color-primary)' },
                { label: 'بازرسی معلق', value: stats.pending_inspections, color: stats.pending_inspections > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)' },
                { label: 'تیکت باز', value: stats.open_tickets, color: stats.open_tickets > 0 ? 'var(--color-notification)' : 'var(--color-text-muted)' },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'var(--color-surface-offset)', borderRadius: 'var(--radius-md)',
                  padding: '0.625rem 1rem', textAlign: 'center', minWidth: 80,
                }}>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.625rem 1rem',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid var(--color-primary)' : '2px solid transparent',
              background: 'none',
              color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: activeTab === tab.key ? 600 : 400,
              cursor: 'pointer',
              fontSize: 'var(--text-sm)',
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              transition: 'all 150ms',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.icon} {tab.label}
            <span style={{
              background: tab.badge ? 'var(--color-notification)' : 'var(--color-surface-dynamic)',
              color: tab.badge ? '#fff' : 'var(--color-text-muted)',
              borderRadius: 'var(--radius-full)',
              padding: '0 0.375rem',
              fontSize: '0.7rem',
              fontWeight: 600,
              minWidth: 18,
              textAlign: 'center',
            }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ─── TAB: Current Assets ─── */}
      {activeTab === 'assets' && (
        <div className="card-section">
          <div className="card-section-header">
            <span style={{ fontWeight: 600 }}>💻 تجهیزات در اختیار کارمند</span>
          </div>
          <div className="card-section-body" style={{ padding: 0 }}>
            {activeAssets.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💾</div>
                <h4>هیچ تجهیزی در اختیار نیست</h4>
                <p>تجهیزی به این کارمند تخصیص داده نشده یا همه بازگردانده شده‌اند.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead><tr><th>کد</th><th>نوع</th><th>برند / مدل</th><th>وضعیت</th><th>تاریخ تخصیص</th><th>موعد بازگشت</th></tr></thead>
                  <tbody>
                    {activeAssets.map(a => (
                      <tr key={a.id}>
                        <td><code>{a.asset?.code || '-'}</code></td>
                        <td>{a.asset?.asset_type?.name || '-'}</td>
                        <td>{[a.asset?.brand, a.asset?.model].filter(Boolean).join(' / ') || '-'}</td>
                        <td><span className={`badge ${STATUS_LABELS[a.asset?.status]?.cls || 'badge-gray'}`}>{STATUS_LABELS[a.asset?.status]?.label || '-'}</span></td>
                        <td>{a.assigned_at ? new Date(a.assigned_at).toLocaleDateString('fa-IR') : '-'}</td>
                        <td>{a.expected_return_date ? new Date(a.expected_return_date).toLocaleDateString('fa-IR') : <span style={{ color: 'var(--color-text-faint)' }}>—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: Assignment History ─── */}
      {activeTab === 'history' && (
        <div className="card-section">
          <div className="card-section-header">
            <span style={{ fontWeight: 600 }}>📂 تاریخچه کامل تخصیص‌ها</span>
          </div>
          <div className="card-section-body" style={{ padding: 0 }}>
            {assignments.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">📂</div><h4>تاریخچه‌ای یافت نشد</h4></div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead><tr><th>کد تجهیز</th><th>نوع</th><th>برند / مدل</th><th>تاریخ تخصیص</th><th>تاریخ بازگشت</th><th>وضعیت</th></tr></thead>
                  <tbody>
                    {assignments.map(a => (
                      <tr key={a.id}>
                        <td><code>{a.asset?.code || '-'}</code></td>
                        <td>{a.asset?.asset_type?.name || '-'}</td>
                        <td>{[a.asset?.brand, a.asset?.model].filter(Boolean).join(' / ') || '-'}</td>
                        <td>{a.assigned_at ? new Date(a.assigned_at).toLocaleDateString('fa-IR') : '-'}</td>
                        <td>{a.returned_at ? new Date(a.returned_at).toLocaleDateString('fa-IR') : <span style={{ color: 'var(--color-text-faint)' }}>— هنوز در اختیار</span>}</td>
                        <td><span className={`badge ${a.status === 'assigned' ? 'badge-success' : 'badge-gray'}`}>{a.status === 'assigned' ? 'فعال' : 'بازگردانده شده'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: Inspections ─── */}
      {activeTab === 'inspections' && (
        <div className="card-section">
          <div className="card-section-header">
            <span style={{ fontWeight: 600 }}>🔍 بازرسی‌های مرتبط به تجهیزات این کارمند</span>
          </div>
          <div className="card-section-body" style={{ padding: 0 }}>
            {inspections.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">🔍</div><h4>بازرسی‌ای یافت نشد</h4></div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead><tr><th>تجهیز</th><th>نوع</th><th>بازرس</th><th>موعد</th><th>وضعیت</th><th>نتیجه</th></tr></thead>
                  <tbody>
                    {inspections.map(ins => (
                      <tr key={ins.id}>
                        <td><small>{ins.asset ? `${ins.asset.asset_type?.name || ''} | ${ins.asset.code}` : '-'}</small></td>
                        <td>{INSPECTION_TYPE[ins.type] || ins.type}</td>
                        <td>{ins.inspector || <span style={{ color: 'var(--color-text-faint)' }}>—</span>}</td>
                        <td style={{ color: !ins.completed_at && new Date(ins.due_at) < new Date() ? 'var(--color-error)' : undefined }}>
                          {new Date(ins.due_at).toLocaleDateString('fa-IR')}
                        </td>
                        <td>
                          {ins.completed_at
                            ? <span className="badge badge-success">تکمیل شده</span>
                            : <span className="badge badge-warning">در انتظار</span>}
                        </td>
                        <td>
                          {ins.result
                            ? <span className={`badge ${INSPECTION_RESULT[ins.result]?.cls || 'badge-gray'}`}>{INSPECTION_RESULT[ins.result]?.label || ins.result}</span>
                            : <span style={{ color: 'var(--color-text-faint)' }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: Tickets ─── */}
      {activeTab === 'tickets' && (
        <div className="card-section">
          <div className="card-section-header">
            <span style={{ fontWeight: 600 }}>🎫 تیکت‌های مرتبط به تجهیزات این کارمند</span>
          </div>
          <div className="card-section-body" style={{ padding: 0 }}>
            {tickets.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">🎫</div><h4>تیکتی یافت نشد</h4></div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead><tr><th>عنوان</th><th>تجهیز</th><th>اولویت</th><th>وضعیت</th><th>تاریخ ثبت</th><th>تاریخ بسته</th></tr></thead>
                  <tbody>
                    {tickets.map(t => (
                      <tr key={t.id}>
                        <td style={{ maxWidth: 220 }}>
                          <div style={{ fontWeight: 500 }}>{t.title}</div>
                          <small style={{ color: 'var(--color-text-muted)' }}>{t.description?.slice(0, 60)}{t.description?.length > 60 ? '...' : ''}</small>
                        </td>
                        <td>{t.asset ? `${t.asset.asset_type?.name || ''} | ${t.asset.code}` : <span style={{ color: 'var(--color-text-faint)' }}>—</span>}</td>
                        <td><span className={`badge ${TICKET_PRIORITY[t.priority]?.cls || 'badge-gray'}`}>{TICKET_PRIORITY[t.priority]?.label || t.priority}</span></td>
                        <td><span className={`badge ${TICKET_STATUS[t.status]?.cls || 'badge-gray'}`}>{TICKET_STATUS[t.status]?.label || t.status}</span></td>
                        <td>{t.created_at ? new Date(t.created_at).toLocaleDateString('fa-IR') : '-'}</td>
                        <td>{t.closed_at ? new Date(t.closed_at).toLocaleDateString('fa-IR') : <span style={{ color: 'var(--color-text-faint)' }}>—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
