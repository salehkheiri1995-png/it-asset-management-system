import React, { useEffect, useState } from 'react';
import api from '../services/api';

const EMPTY = { first_name: '', last_name: '', personnel_code: '', phone: '', email: '', building: '', floor: '', room: '', is_active: true, department_id: '' };

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [e, d] = await Promise.all([api.get('/employees/'), api.get('/employees/departments/')]);
      setEmployees(e.data);
      setDepartments(d.data);
    } catch { setEmployees([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = employees.filter(e =>
    `${e.first_name} ${e.last_name} ${e.personnel_code}`.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditing(null); setForm(EMPTY); setError(''); setShowModal(true); };
  const openEdit = (e) => { setEditing(e); setForm({ ...e, department_id: e.department_id || '' }); setError(''); setShowModal(true); };
  const closeModal = () => setShowModal(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const data = { ...form, department_id: form.department_id || null };
      if (editing) await api.put(`/employees/${editing.id}`, data);
      else await api.post('/employees/', data);
      closeModal(); load();
    } catch (err) {
      setError(err.response?.data?.detail || 'خطا در ذخیره‌سازی');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('آیا از حذف این کارمند مطمئن هستید؟')) return;
    try { await api.delete(`/employees/${id}`); load(); } catch { alert('خطا در حذف'); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">👥 مدیریت کارمندان</div>
        <div className="page-subtitle">ثبت و مدیریت اطلاعات کارمندان سازمان</div>
      </div>

      <div className="card-section">
        <div className="card-section-header">
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <input className="search-input" placeholder="🔍 جستجو بر اساس نام یا کد پرسنلی..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn-primary-custom" onClick={openAdd}>➕ افزودن کارمند</button>
        </div>
        <div className="card-section-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="empty-state"><div className="spinner"></div></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">👤</div><h4>کارمندی یافت نشد</h4><p>اولین کارمند را اضافه کنید</p></div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead><tr><th>#</th><th>نام و نام خانوادگی</th><th>کد پرسنلی</th><th>واحد</th><th>تلفن</th><th>محل کار</th><th>وضعیت</th><th>عملیات</th></tr></thead>
                <tbody>
                  {filtered.map((emp, i) => (
                    <tr key={emp.id}>
                      <td>{i + 1}</td>
                      <td><strong>{emp.first_name} {emp.last_name}</strong></td>
                      <td><code>{emp.personnel_code}</code></td>
                      <td>{departments.find(d => d.id === emp.department_id)?.name || '-'}</td>
                      <td>{emp.phone || '-'}</td>
                      <td>{[emp.building, emp.floor, emp.room].filter(Boolean).join(' / ') || '-'}</td>
                      <td><span className={`badge ${emp.is_active ? 'badge-success' : 'badge-gray'}`}>{emp.is_active ? 'فعال' : 'غیرفعال'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <button className="btn-edit-custom" onClick={() => openEdit(emp)}>✏️ ویرایش</button>
                          <button className="btn-danger-custom" onClick={() => handleDelete(emp.id)}>🗑️</button>
                        </div>
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
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing ? '✏️ ویرایش کارمند' : '➕ افزودن کارمند'}</span>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            {error && <div className="alert-box danger">{error}</div>}
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">نام *</label>
                  <input className="form-control" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">نام خانوادگی *</label>
                  <input className="form-control" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">کد پرسنلی *</label>
                  <input className="form-control" value={form.personnel_code} onChange={e => setForm({...form, personnel_code: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">واحد سازمانی</label>
                  <select className="form-control" value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})}>
                    <option value="">-- انتخاب کنید --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">تلفن</label>
                  <input className="form-control" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">ایمیل</label>
                  <input className="form-control" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">ساختمان</label>
                  <input className="form-control" value={form.building} onChange={e => setForm({...form, building: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">طبقه / اتاق</label>
                  <input className="form-control" value={form.floor} onChange={e => setForm({...form, floor: e.target.value})} placeholder="طبقه" />
                </div>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} />
                  <span className="form-label" style={{ margin: 0 }}>کارمند فعال است</span>
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary-custom" onClick={closeModal}>انصراف</button>
                <button type="submit" className="btn-primary-custom" disabled={saving}>{saving ? 'در حال ذخیره...' : '💾 ذخیره'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
