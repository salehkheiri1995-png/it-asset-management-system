import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ asset_id: '', employee_id: '', expected_return_date: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [a, e, as] = await Promise.all([api.get('/assignments/'), api.get('/employees/'), api.get('/assets/')]);
      setAssignments(a.data); setEmployees(e.data); setAssets(as.data);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await api.post('/assignments/', {
        asset_id: parseInt(form.asset_id),
        employee_id: parseInt(form.employee_id),
        expected_return_date: form.expected_return_date ? new Date(form.expected_return_date).toISOString() : null,
      });
      setShowModal(false); load();
    } catch (err) { setError(err.response?.data?.detail || 'خطا'); } finally { setSaving(false); }
  };

  const handleReturn = async (id) => {
    if (!window.confirm('آیا تجهیز بازگردانده شده است؟')) return;
    try { await api.post(`/assignments/${id}/return`); load(); } catch { alert('خطا'); }
  };

  const getEmployeeName = (id) => { const e = employees.find(x => x.id === id); return e ? `${e.first_name} ${e.last_name}` : id; };
  const getAssetCode = (id) => { const a = assets.find(x => x.id === id); return a ? a.code : id; };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">🔗 تخصیص تجهیزات</div>
        <div className="page-subtitle">مدیریت تخصیص و بازپس‌گیری تجهیزات</div>
      </div>

      <div className="card-section">
        <div className="card-section-header">
          <span className="card-section-title">لیست تخصیص‌ها</span>
          <button className="btn-primary-custom" onClick={() => { setForm({ asset_id: '', employee_id: '', expected_return_date: '' }); setError(''); setShowModal(true); }}>➕ تخصیص جدید</button>
        </div>
        <div className="card-section-body" style={{ padding: 0 }}>
          {loading ? <div className="empty-state"><div className="spinner"></div></div>
          : assignments.length === 0 ? <div className="empty-state"><div className="empty-state-icon">🔗</div><h4>تخصیصی ثبت نشده</h4></div>
          : (
            <div className="table-responsive">
              <table className="data-table">
                <thead><tr><th>#</th><th>تجهیز</th><th>کارمند</th><th>تاریخ تخصیص</th><th>موعد بازگشت</th><th>وضعیت</th><th>عملیات</th></tr></thead>
                <tbody>
                  {assignments.map((a, i) => (
                    <tr key={a.id}>
                      <td>{i+1}</td>
                      <td><code>{getAssetCode(a.asset_id)}</code></td>
                      <td>{getEmployeeName(a.employee_id)}</td>
                      <td style={{fontSize:'0.8125rem'}}>{new Date(a.assigned_at).toLocaleDateString('fa-IR')}</td>
                      <td style={{fontSize:'0.8125rem'}}>{a.expected_return_date ? new Date(a.expected_return_date).toLocaleDateString('fa-IR') : '-'}</td>
                      <td><span className={`badge ${a.status === 'assigned' ? 'badge-warning' : 'badge-success'}`}>{a.status === 'assigned' ? 'تخصیص‌یافته' : 'بازگردانده‌شده'}</span></td>
                      <td>{a.status === 'assigned' && <button className="btn-secondary-custom" onClick={() => handleReturn(a.id)}>↩️ بازپس‌گیری</button>}</td>
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
              <span className="modal-title">➕ تخصیص جدید</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert-box danger">{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">تجهیز *</label>
                <select className="form-control" value={form.asset_id} onChange={e => setForm({...form, asset_id: e.target.value})} required>
                  <option value="">-- انتخاب تجهیز --</option>
                  {assets.filter(a => a.status === 'healthy').map(a => <option key={a.id} value={a.id}>{a.code} - {a.brand} {a.model}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">کارمند *</label>
                <select className="form-control" value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})} required>
                  <option value="">-- انتخاب کارمند --</option>
                  {employees.filter(e => e.is_active).map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.personnel_code})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">موعد بازپس‌گیری (اختیاری)</label>
                <input className="form-control" type="date" value={form.expected_return_date} onChange={e => setForm({...form, expected_return_date: e.target.value})} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary-custom" onClick={() => setShowModal(false)}>انصراف</button>
                <button type="submit" className="btn-primary-custom" disabled={saving}>{saving ? 'در حال ثبت...' : '💾 ثبت تخصیص'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
