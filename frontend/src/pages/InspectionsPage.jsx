import React, { useEffect, useState } from 'react';
import api from '../services/api';

const TYPE_LABELS = { hardware: 'سخت‌افزاری', software: 'نرم‌افزاری', security: 'امنیتی', general: 'عمومی' };
const RESULT_LABELS = { ok: { label: 'سالم', cls: 'badge-success' }, repair: { label: 'تعمیر', cls: 'badge-warning' }, replace: { label: 'تعویض', cls: 'badge-danger' }, follow_up: { label: 'پیگیری', cls: 'badge-orange' }, issue_found: { label: 'مشکل یافت شد', cls: 'badge-danger' } };

const EMPTY = { asset_id: '', employee_id: '', type: 'hardware', scheduled_at: '', due_at: '' };

export default function InspectionsPage() {
  const [inspections, setInspections] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [ins, al] = await Promise.all([api.get('/inspections/'), api.get('/inspections/alerts/today')]);
      setInspections(ins.data); setAlerts(al.data);
    } catch { setInspections([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const data = {
        ...form,
        asset_id: form.asset_id ? parseInt(form.asset_id) : null,
        employee_id: form.employee_id ? parseInt(form.employee_id) : null,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        due_at: new Date(form.due_at).toISOString(),
      };
      await api.post('/inspections/', data);
      setShowModal(false); setForm(EMPTY); load();
    } catch (err) { setError(err.response?.data?.detail || 'خطا'); } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">🔍 بازرسی‌های دوره‌ای</div>
        <div className="page-subtitle">برنامه‌ریزی و پیگیری بازرسی‌های دوره‌ای تجهیزات</div>
      </div>

      {alerts.length > 0 && (
        <div className="alert-box warning" style={{ marginBottom: '1rem' }}>
          ⚠️ <strong>{alerts.length} بازرسی</strong> دارای موعد نزدیک یا گذشته هستند!
        </div>
      )}

      <div className="card-section">
        <div className="card-section-header">
          <span className="card-section-title">لیست بازرسی‌ها</span>
          <button className="btn-primary-custom" onClick={() => { setForm(EMPTY); setError(''); setShowModal(true); }}>➕ بازرسی جدید</button>
        </div>
        <div className="card-section-body" style={{ padding: 0 }}>
          {loading ? <div className="empty-state"><div className="spinner"></div></div>
          : inspections.length === 0 ? <div className="empty-state"><div className="empty-state-icon">🔍</div><h4>بازرسی‌ای ثبت نشده</h4></div>
          : (
            <div className="table-responsive">
              <table className="data-table">
                <thead><tr><th>#</th><th>نوع</th><th>موعد</th><th>تاریخ زمان‌بندی</th><th>نتیجه</th><th>وضعیت</th></tr></thead>
                <tbody>
                  {inspections.map((ins, i) => (
                    <tr key={ins.id}>
                      <td>{i+1}</td>
                      <td><span className="badge badge-info">{TYPE_LABELS[ins.type] || ins.type}</span></td>
                      <td>{new Date(ins.due_at).toLocaleDateString('fa-IR')}</td>
                      <td>{new Date(ins.scheduled_at).toLocaleDateString('fa-IR')}</td>
                      <td>{ins.result ? <span className={`badge ${RESULT_LABELS[ins.result]?.cls}`}>{RESULT_LABELS[ins.result]?.label}</span> : <span className="badge badge-gray">در انتظار</span>}</td>
                      <td><span className={`badge ${ins.completed_at ? 'badge-success' : 'badge-warning'}`}>{ins.completed_at ? 'انجام‌شده' : 'در انتظار'}</span></td>
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
              <span className="modal-title">➕ ثبت بازرسی جدید</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert-box danger">{error}</div>}
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">نوع بازرسی *</label>
                  <select className="form-control" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    {Object.entries(TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">شناسه تجهیز</label>
                  <input className="form-control" type="number" value={form.asset_id} onChange={e => setForm({...form, asset_id: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">تاریخ زمان‌بندی *</label>
                  <input className="form-control" type="date" value={form.scheduled_at} onChange={e => setForm({...form, scheduled_at: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">موعد بازرسی *</label>
                  <input className="form-control" type="date" value={form.due_at} onChange={e => setForm({...form, due_at: e.target.value})} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary-custom" onClick={() => setShowModal(false)}>انصراف</button>
                <button type="submit" className="btn-primary-custom" disabled={saving}>{saving ? 'در حال ثبت...' : '💾 ثبت بازرسی'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
