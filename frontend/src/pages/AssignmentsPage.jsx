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
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const load = async () => {
    try {
      const [a, e, as_] = await Promise.all([
        api.get('/assignments/'),
        api.get('/employees/'),
        api.get('/assets/'),
      ]);
      setAssignments(a.data);
      setEmployees(e.data);
      // only show assets not currently assigned
      setAssets(as_.data);
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
      setShowModal(false);
      setForm({ asset_id: '', employee_id: '', expected_return_date: '' });
      load();
    } catch (err) { setError(err.response?.data?.detail || 'خطا'); }
    finally { setSaving(false); }
  };

  const handleReturn = async (id) => {
    if (!window.confirm('آیا تجهیز بازگردانده شده است؟')) return;
    try { await api.post(`/assignments/${id}/return`); load(); } catch { alert('خطا در ثبت بازگشت'); }
  };

  // use nested data from enriched API
  const empName = (a) => a.employee ? `${a.employee.first_name} ${a.employee.last_name}` : '-';
  const empDept = (a) => a.employee?.department?.name || '-';
  const assetCode = (a) => a.asset?.code || '-';
  const assetType = (a) => a.asset?.asset_type?.name || '-';
  const assetLabel = (a) => [a.asset?.brand, a.asset?.model].filter(Boolean).join(' / ') || '-';

  const filtered = assignments.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !search || `${empName(a)} ${assetCode(a)} ${empDept(a)}`.toLowerCase().includes(q);
    const matchStatus = !filterStatus || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const freeAssets = assets.filter(a => a.location_status !== 'in_use');

  return (
    <div>
      <div className="page-header">
        <div className="page-title">🔗 تخصیص تجهیزات</div>
        <div className="page-subtitle">مدیریت تخصیص و بازپس‌گیری تجهیزات به کارمندان</div>
      </div>

      <div className="card-section">
        <div className="card-section-header">
          <div className="toolbar" style={{ marginBottom: 0, gap: '0.5rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <input className="search-input" placeholder="🔍 جستجو نام کارمند، کد تجهیز..." value={search} onChange={e => setSearch(e.target.value)} />
            <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">همه وضعیت‌ها</option>
              <option value="assigned">تخصیص داده شده</option>
              <option value="returned">بازگردانده شده</option>
            </select>
          </div>
          <button className="btn-primary-custom" onClick={() => { setError(''); setForm({ asset_id: '', employee_id: '', expected_return_date: '' }); setShowModal(true); }}>
            ➕ تخصیص جدید
          </button>
        </div>

        <div className="card-section-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="empty-state"><div className="spinner"></div></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔗</div>
              <h4>تخصیصی یافت نشد</h4>
              <p>برای شروع تجهیزی را به کارمند تخصیص دهید.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>تجهیز</th>
                    <th>نوع</th>
                    <th>کارمند</th>
                    <th>واحد</th>
                    <th>تاریخ تخصیص</th>
                    <th>موعد بازگشت</th>
                    <th>وضعیت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a.id}>
                      <td><code>{assetCode(a)}</code><br /><small style={{ color: 'var(--color-text-muted)' }}>{assetLabel(a)}</small></td>
                      <td>{assetType(a)}</td>
                      <td>{empName(a)}</td>
                      <td>{empDept(a)}</td>
                      <td>{a.assigned_at ? new Date(a.assigned_at).toLocaleDateString('fa-IR') : '-'}</td>
                      <td>{a.expected_return_date ? new Date(a.expected_return_date).toLocaleDateString('fa-IR') : '-'}</td>
                      <td>
                        <span className={`badge ${a.status === 'assigned' ? 'badge-success' : 'badge-gray'}`}>
                          {a.status === 'assigned' ? 'تخصیص داده شده' : 'بازگردانده شده'}
                        </span>
                      </td>
                      <td>
                        {a.status === 'assigned' && (
                          <button className="btn-edit-custom" style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem' }} onClick={() => handleReturn(a.id)}>
                            🔄 بازگشت
                          </button>
                        )}
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
              <span className="modal-title">➕ تخصیص تجهیز به کارمند</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert-box danger">{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">تجهیز *</label>
                <select className="form-control" value={form.asset_id} onChange={e => setForm({ ...form, asset_id: e.target.value })} required>
                  <option value="">-- انتخاب تجهیز (موجود در انبار) --</option>
                  {freeAssets.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.code} – {a.asset_type?.name || ''} {a.brand ? `| ${a.brand}` : ''} {a.model ? a.model : ''}
                    </option>
                  ))}
                </select>
                {freeAssets.length === 0 && <small style={{ color: 'var(--color-warning)' }}>همه تجهیزات در حال حاضر تخصیص داده شده‌اند.</small>}
              </div>
              <div className="form-group">
                <label className="form-label">کارمند *</label>
                <select className="form-control" value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} required>
                  <option value="">-- انتخاب کارمند --</option>
                  {employees.filter(e => e.is_active).map(e => (
                    <option key={e.id} value={e.id}>
                      {e.first_name} {e.last_name} – {e.personnel_code} {e.department ? `| ${e.department.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">تاریخ موعد بازگشت (اختیاری)</label>
                <input type="date" className="form-control" value={form.expected_return_date} onChange={e => setForm({ ...form, expected_return_date: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary-custom" onClick={() => setShowModal(false)}>انصراف</button>
                <button type="submit" className="btn-primary-custom" disabled={saving}>{saving ? 'در حال ثبت...' : 'ثبت تخصیص'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
