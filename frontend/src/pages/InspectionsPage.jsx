import React, { useEffect, useState } from 'react';
import api from '../services/api';

const TYPE_LABELS = { hardware: 'سخت‌افزاری', software: 'نرم‌افزاری', security: 'امنیتی', general: 'عمومی' };
const RESULT_LABELS = {
  ok: { label: 'سالم', cls: 'badge-success' },
  repair: { label: 'تعمیر', cls: 'badge-warning' },
  replace: { label: 'تعویض', cls: 'badge-danger' },
  follow_up: { label: 'پیگیری', cls: 'badge-orange' },
  issue_found: { label: 'مشکل یافت شد', cls: 'badge-danger' },
};

const EMPTY_FORM = { asset_id: '', employee_id: '', type: 'hardware', scheduled_at: '', due_at: '', notes: '' };
const COMPLETE_EMPTY = { result: '', notes: '', received_from_employee_id: '', delivered_to_employee_id: '', location_after: '' };

export default function InspectionsPage() {
  const [inspections, setInspections] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [completeModal, setCompleteModal] = useState(null); // inspection obj
  const [form, setForm] = useState(EMPTY_FORM);
  const [completeForm, setCompleteForm] = useState(COMPLETE_EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  const load = async () => {
    try {
      const [ins, al, emp, ast] = await Promise.all([
        api.get('/inspections/'),
        api.get('/inspections/alerts/today'),
        api.get('/employees/'),
        api.get('/assets/'),
      ]);
      setInspections(ins.data);
      setAlerts(al.data);
      setEmployees(emp.data);
      setAssets(ast.data);
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
      setShowModal(false); setForm(EMPTY_FORM); load();
    } catch (err) { setError(err.response?.data?.detail || 'خطا'); }
    finally { setSaving(false); }
  };

  const handleComplete = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const data = {
        result: completeForm.result || null,
        notes: completeForm.notes || null,
        received_from_employee_id: completeForm.received_from_employee_id ? parseInt(completeForm.received_from_employee_id) : null,
        delivered_to_employee_id: completeForm.delivered_to_employee_id ? parseInt(completeForm.delivered_to_employee_id) : null,
        location_after: completeForm.location_after || null,
      };
      await api.post(`/inspections/${completeModal.id}/complete`, data);
      setCompleteModal(null); setCompleteForm(COMPLETE_EMPTY); load();
    } catch (err) { setError(err.response?.data?.detail || 'خطا'); }
    finally { setSaving(false); }
  };

  const empName = (emp) => emp ? `${emp.first_name} ${emp.last_name}` : '-';
  const assetLabel = (ins) => {
    if (!ins.asset) return '-';
    return [ins.asset.asset_type?.name, ins.asset.code, ins.asset.brand, ins.asset.model].filter(Boolean).join(' | ');
  };

  const filtered = inspections.filter(ins => {
    const q = search.toLowerCase();
    const matchSearch = !search || assetLabel(ins).toLowerCase().includes(q) || empName(ins.inspector_employee).toLowerCase().includes(q);
    const matchType = !filterType || ins.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">🔍 بازرسی‌های دوره‌ای</div>
        <div className="page-subtitle">برنامه‌ریزی، انجام و ثبت نتایج بازرسی تجهیزات</div>
      </div>

      {alerts.length > 0 && (
        <div className="alert-box warning" style={{ marginBottom: '1rem' }}>
          <strong>⚠️ {alerts.length} بازرسی سررسید نزدیک یا عقب‌افتاده دارید!</strong>
          <ul style={{ margin: '0.5rem 0 0', paddingRight: '1.25rem' }}>
            {alerts.slice(0, 5).map(a => (
              <li key={a.id}>
                {assetLabel(a)} — موعد: {new Date(a.due_at).toLocaleDateString('fa-IR')}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card-section">
        <div className="card-section-header">
          <div className="toolbar" style={{ marginBottom: 0, display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input className="search-input" placeholder="🔍 جستجو بر اساس تجهیز یا بازرس..." value={search} onChange={e => setSearch(e.target.value)} />
            <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">همه انواع</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <button className="btn-primary-custom" onClick={() => { setError(''); setForm(EMPTY_FORM); setShowModal(true); }}>
            ➕ بازرسی جدید
          </button>
        </div>

        <div className="card-section-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="empty-state"><div className="spinner"></div></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h4>بازرسی یافت نشد</h4>
              <p>برای شروع یک بازرسی جدید ایجاد کنید.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>تجهیز</th>
                    <th>نوع بازرسی</th>
                    <th>بازرس</th>
                    <th>دارنده فعلی</th>
                    <th>موعد</th>
                    <th>نتیجه</th>
                    <th>وضعیت حضانت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(ins => (
                    <tr key={ins.id}>
                      <td><small>{assetLabel(ins)}</small></td>
                      <td>{TYPE_LABELS[ins.type] || ins.type}</td>
                      <td>{empName(ins.inspector_employee)}</td>
                      <td>{empName(ins.current_holder)}</td>
                      <td style={{ color: !ins.completed_at && new Date(ins.due_at) < new Date() ? 'var(--color-error)' : undefined }}>
                        {new Date(ins.due_at).toLocaleDateString('fa-IR')}
                      </td>
                      <td>
                        {ins.result ? (
                          <span className={`badge ${RESULT_LABELS[ins.result]?.cls || 'badge-gray'}`}>{RESULT_LABELS[ins.result]?.label || ins.result}</span>
                        ) : ins.completed_at ? (
                          <span className="badge badge-success">تکمیل شده</span>
                        ) : (
                          <span className="badge badge-gray">برنامه‌ریزی شده</span>
                        )}
                      </td>
                      <td>
                        {ins.received_from && <div><small>📥 از: {empName(ins.received_from)}</small></div>}
                        {ins.delivered_to && <div><small>📤 به: {empName(ins.delivered_to)}</small></div>}
                        {ins.location_after && <div><small>📍 {ins.location_after === 'in_use' ? 'در استفاده' : ins.location_after === 'in_storage' ? 'انبار' : 'تعمیرگاه'}</small></div>}
                      </td>
                      <td>
                        {!ins.completed_at && (
                          <button
                            className="btn-edit-custom"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem' }}
                            onClick={() => { setError(''); setCompleteForm(COMPLETE_EMPTY); setCompleteModal(ins); }}
                          >
                            ✅ تکمیل
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

      {/* ADD INSPECTION MODAL */}
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
                  <label className="form-label">تجهیز</label>
                  <select className="form-control" value={form.asset_id} onChange={e => setForm({ ...form, asset_id: e.target.value })}>
                    <option value="">-- انتخاب کنید --</option>
                    {assets.map(a => <option key={a.id} value={a.id}>{a.code} | {a.asset_type?.name || ''} {a.brand || ''}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">بازرس (کارمند مسئول)</label>
                  <select className="form-control" value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}>
                    <option value="">-- انتخاب کنید --</option>
                    {employees.filter(e => e.is_active).map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} | {e.personnel_code}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">نوع بازرسی *</label>
                  <select className="form-control" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">تاریخ برنامه‌ریزی *</label>
                  <input type="date" className="form-control" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">موعد مقرر *</label>
                  <input type="date" className="form-control" value={form.due_at} onChange={e => setForm({ ...form, due_at: e.target.value })} required />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">یادداشت</label>
                  <textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary-custom" onClick={() => setShowModal(false)}>انصراف</button>
                <button type="submit" className="btn-primary-custom" disabled={saving}>{saving ? 'در حال ثبت...' : 'ثبت بازرسی'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETE INSPECTION MODAL */}
      {completeModal && (
        <div className="modal-overlay" onClick={() => setCompleteModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">✅ ثبت نتیجه بازرسی</span>
              <button className="modal-close" onClick={() => setCompleteModal(null)}>✕</button>
            </div>
            <div style={{ marginBottom: '0.75rem', padding: '0.625rem', background: 'var(--color-surface-offset)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
              <strong>تجهیز:</strong> {assetLabel(completeModal)}<br />
              {completeModal.current_holder && <><strong>دارنده فعلی:</strong> {empName(completeModal.current_holder)}<br /></>}
            </div>
            {error && <div className="alert-box danger">{error}</div>}
            <form onSubmit={handleComplete}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">نتیجه بازرسی *</label>
                  <select className="form-control" value={completeForm.result} onChange={e => setCompleteForm({ ...completeForm, result: e.target.value })} required>
                    <option value="">-- انتخاب کنید --</option>
                    {Object.entries(RESULT_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">مکان بعد از بازرسی</label>
                  <select className="form-control" value={completeForm.location_after} onChange={e => setCompleteForm({ ...completeForm, location_after: e.target.value })}>
                    <option value="">-- انتخاب کنید --</option>
                    <option value="in_use">در استفاده (بازگشت به کارمند)</option>
                    <option value="in_storage">انبار</option>
                    <option value="repair">ارسال به تعمیرگاه</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">دریافت شده از (کارمند)</label>
                  <select className="form-control" value={completeForm.received_from_employee_id} onChange={e => setCompleteForm({ ...completeForm, received_from_employee_id: e.target.value })}>
                    <option value="">-- انتخاب کنید --</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">تحویل داده شده به (کارمند)</label>
                  <select className="form-control" value={completeForm.delivered_to_employee_id} onChange={e => setCompleteForm({ ...completeForm, delivered_to_employee_id: e.target.value })}>
                    <option value="">-- انتخاب کنید --</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">یادداشت</label>
                  <textarea className="form-control" rows={2} value={completeForm.notes} onChange={e => setCompleteForm({ ...completeForm, notes: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary-custom" onClick={() => setCompleteModal(null)}>انصراف</button>
                <button type="submit" className="btn-primary-custom" disabled={saving}>{saving ? 'در حال ثبت...' : 'ثبت نتیجه'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
