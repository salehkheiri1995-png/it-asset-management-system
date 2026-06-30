import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const EMPTY = { first_name: '', last_name: '', personnel_code: '', phone: '', email: '', building: '', floor: '', room: '', is_active: true, department_id: '' };

export default function EmployeesPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
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

  const filtered = employees.filter(e => {
    const matchSearch = !search || `${e.first_name} ${e.last_name} ${e.personnel_code}`.toLowerCase().includes(search.toLowerCase());
    const matchDept = !deptFilter || String(e.department_id) === deptFilter;
    return matchSearch && matchDept;
  });

  const openAdd = () => { setEditing(null); setForm(EMPTY); setError(''); setShowModal(true); };
  const openEdit = (e) => { setEditing(e); setForm({ ...e, department_id: e.department_id || '' }); setError(''); setShowModal(true); };

  const handleSave = async (ev) => {
    ev.preventDefault(); setSaving(true); setError('');
    try {
      const data = { ...form, department_id: form.department_id ? parseInt(form.department_id) : null };
      if (editing) await api.put(`/employees/${editing.id}`, data);
      else await api.post('/employees/', data);
      setShowModal(false); load();
    } catch (err) { setError(err.response?.data?.detail || 'خطا در ذخیره‌سازی'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('آیا از حذف این کارمند مطمئنید؟')) return;
    try { await api.delete(`/employees/${id}`); load(); }
    catch (err) { alert(err.response?.data?.detail || 'خطا در حذف'); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">👥 مدیریت کارمندان</div>
        <div className="page-subtitle">مشاهده و مدیریت پرسنل سازمان</div>
      </div>

      <div className="card-section">
        <div className="card-section-header">
          <div className="toolbar" style={{ marginBottom: 0, display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              className="search-input"
              placeholder="🔍 جستجو نام، کد پرسنلی..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="filter-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="">همه واحد‌ها</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <button className="btn-primary-custom" onClick={openAdd}>➕ افزودن کارمند</button>
        </div>

        <div className="card-section-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="empty-state"><div className="spinner"></div></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👤</div>
              <h4>کارمندی یافت نشد</h4>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>نام و نام خانوادگی</th>
                    <th>کد پرسنلی</th>
                    <th>واحد</th>
                    <th>محل استقرار</th>
                    <th>تماس</th>
                    <th>وضعیت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(emp => (
                    <tr
                      key={emp.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/employees/${emp.id}`)}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: 'var(--color-primary-highlight)',
                            color: 'var(--color-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '0.875rem', flexShrink: 0,
                          }}>
                            {emp.first_name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500 }}>{emp.first_name} {emp.last_name}</div>
                            {emp.email && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{emp.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td><code>{emp.personnel_code}</code></td>
                      <td>{emp.department?.name || <span style={{ color: 'var(--color-text-faint)' }}>—</span>}</td>
                      <td>
                        {[emp.building, emp.floor && `ط ${emp.floor}`, emp.room && `ا ${emp.room}`].filter(Boolean).join(' / ') ||
                          <span style={{ color: 'var(--color-text-faint)' }}>—</span>}
                      </td>
                      <td>{emp.phone || <span style={{ color: 'var(--color-text-faint)' }}>—</span>}</td>
                      <td>
                        <span className={`badge ${emp.is_active ? 'badge-success' : 'badge-gray'}`}>
                          {emp.is_active ? 'فعال' : 'غیرفعال'}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <button className="btn-edit-custom" onClick={() => openEdit(emp)}>✏️</button>
                          <button className="btn-delete-custom" onClick={() => handleDelete(emp.id)}>🗑️</button>
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

      {/* Modal ─ Add/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <span className="modal-title">{editing ? '✏️ ویرایش کارمند' : '➕ افزودن کارمند'}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert-box danger">{error}</div>}
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">نام *</label>
                  <input className="form-control" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">نام خانوادگی *</label>
                  <input className="form-control" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">کد پرسنلی *</label>
                  <input className="form-control" value={form.personnel_code} onChange={e => setForm({ ...form, personnel_code: e.target.value })} required disabled={!!editing} />
                </div>
                <div className="form-group">
                  <label className="form-label">واحد سازمانی</label>
                  <select className="form-control" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
                    <option value="">-- انتخاب کنید --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">تلفن</label>
                  <input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">ایمیل</label>
                  <input type="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">ساختمان</label>
                  <input className="form-control" value={form.building} onChange={e => setForm({ ...form, building: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">طبقه</label>
                  <input className="form-control" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">اتاق</label>
                  <input className="form-control" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.5rem' }}>
                  <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                  <label htmlFor="is_active" style={{ marginBottom: 0, cursor: 'pointer' }}>کارمند فعال</label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary-custom" onClick={() => setShowModal(false)}>انصراف</button>
                <button type="submit" className="btn-primary-custom" disabled={saving}>{saving ? 'در حال ذخیره...' : editing ? 'ذخیره تغییرات' : 'افزودن کارمند'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
