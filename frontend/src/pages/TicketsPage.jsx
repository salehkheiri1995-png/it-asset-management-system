import React, { useEffect, useState } from 'react';
import api from '../services/api';

const PRIORITY = { low: { label: 'کم', cls: 'badge-success' }, medium: { label: 'متوسط', cls: 'badge-info' }, high: { label: 'بالا', cls: 'badge-warning' }, urgent: { label: 'فوری', cls: 'badge-danger' } };
const STATUS = { opened: { label: 'ثبت‌شده', cls: 'badge-info' }, in_review: { label: 'بررسی', cls: 'badge-orange' }, in_progress: { label: 'در انجام', cls: 'badge-warning' }, done: { label: 'انجام‌شده', cls: 'badge-success' }, closed: { label: 'بسته', cls: 'badge-gray' } };

const EMPTY = { title: '', description: '', priority: 'medium', asset_id: '' };

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try { const r = await api.get('/tickets/'); setTickets(r.data); }
    catch { setTickets([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = tickets.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await api.post('/tickets/', { ...form, asset_id: form.asset_id ? parseInt(form.asset_id) : null });
      setShowModal(false); setForm(EMPTY); load();
    } catch (err) { setError(err.response?.data?.detail || 'خطا'); } finally { setSaving(false); }
  };

  const updateStatus = async (id, status) => {
    try { await api.put(`/tickets/${id}`, { status }); load(); } catch { alert('خطا'); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">🎫 تیکت‌های پشتیبانی</div>
        <div className="page-subtitle">مدیریت درخواست‌های پشتیبانی فنی</div>
      </div>

      <div className="card-section">
        <div className="card-section-header">
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <input className="search-input" placeholder="🔍 جستجو در تیکت‌ها..." value={search} onChange={e => setSearch(e.target.value)} />
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">همه وضعیت‌ها</option>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <button className="btn-primary-custom" onClick={() => { setForm(EMPTY); setError(''); setShowModal(true); }}>➕ ثبت تیکت جدید</button>
        </div>
        <div className="card-section-body" style={{ padding: 0 }}>
          {loading ? <div className="empty-state"><div className="spinner"></div></div>
          : filtered.length === 0 ? <div className="empty-state"><div className="empty-state-icon">🎫</div><h4>تیکتی یافت نشد</h4></div>
          : (
            <div className="table-responsive">
              <table className="data-table">
                <thead><tr><th>#</th><th>موضوع</th><th>اولویت</th><th>وضعیت</th><th>تاریخ ثبت</th><th>تغییر وضعیت</th></tr></thead>
                <tbody>
                  {filtered.map((t, i) => (
                    <tr key={t.id}>
                      <td>{i+1}</td>
                      <td><strong>{t.title}</strong><br/><small style={{color:'#718096'}}>{t.description?.slice(0,60)}...</small></td>
                      <td><span className={`badge ${PRIORITY[t.priority]?.cls}`}>{PRIORITY[t.priority]?.label}</span></td>
                      <td><span className={`badge ${STATUS[t.status]?.cls}`}>{STATUS[t.status]?.label}</span></td>
                      <td style={{fontSize:'0.8125rem',color:'#718096'}}>{new Date(t.created_at).toLocaleDateString('fa-IR')}</td>
                      <td>
                        <select className="filter-select" style={{fontSize:'0.75rem',padding:'0.25rem 0.5rem'}} value={t.status} onChange={e => updateStatus(t.id, e.target.value)}>
                          {Object.entries(STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">➕ ثبت تیکت جدید</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert-box danger">{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">موضوع *</label>
                <input className="form-control" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">شرح درخواست *</label>
                <textarea className="form-control" rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">اولویت</label>
                  <select className="form-control" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                    {Object.entries(PRIORITY).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">شناسه تجهیز (اختیاری)</label>
                  <input className="form-control" type="number" value={form.asset_id} onChange={e => setForm({...form, asset_id: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary-custom" onClick={() => setShowModal(false)}>انصراف</button>
                <button type="submit" className="btn-primary-custom" disabled={saving}>{saving ? 'در حال ثبت...' : '💾 ثبت تیکت'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
